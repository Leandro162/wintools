import { buildCoverPrompt } from '../../../src/server/cover-prompt.js';

const MODEL = '@cf/black-forest-labs/flux-1-schnell';

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: 'Workers AI binding AI is not configured' }, 500);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!String(input?.title || '').trim()) return json({ error: '请先填写文章标题' }, 400);

  const result = await env.AI.run(MODEL, {
    prompt: buildCoverPrompt(input),
    width: 1024,
    height: 576,
    num_steps: 4,
  });

  if (result instanceof Response) {
    return new Response(result.body, {
      headers: imageHeaders(result.headers.get('Content-Type') || 'image/png'),
    });
  }
  if (result instanceof ReadableStream) {
    return new Response(result, { headers: imageHeaders('image/png') });
  }
  if (result?.image) {
    return new Response(base64ToBytes(result.image), { headers: imageHeaders('image/png') });
  }
  return json({ error: 'Workers AI returned an unsupported image response' }, 502);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function imageHeaders(contentType) {
  return { 'Content-Type': contentType, 'Cache-Control': 'no-store' };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
