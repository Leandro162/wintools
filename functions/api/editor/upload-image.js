const DEFAULT_IMAGE_BASE_URL = 'https://img.winstools.com';

export async function onRequestPost({ request, env }) {
  if (!env.WINSTOOLS_IMAGES) {
    return json({ error: 'R2 binding WINSTOOLS_IMAGES is not configured' }, 500);
  }

  const key = sanitizeKey(request.headers.get('X-Image-Key') || '');
  if (!key) {
    return json({ error: 'Missing image key' }, 400);
  }

  const contentType = request.headers.get('Content-Type') || 'image/webp';
  const body = await request.arrayBuffer();
  if (!body.byteLength) {
    return json({ error: 'Empty image body' }, 400);
  }

  await env.WINSTOOLS_IMAGES.put(key, body, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  const baseUrl = (env.IMAGE_BASE_URL || DEFAULT_IMAGE_BASE_URL).replace(/\/+$/, '');
  return json({
    key,
    url: `${baseUrl}/${key}`,
    size: body.byteLength,
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function sanitizeKey(value) {
  const key = value
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');

  if (!/^articles\/[a-z0-9-]+\/[a-z0-9._-]+\.webp$/.test(key)) return '';
  return key;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://winstools.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Image-Key',
  };
}
