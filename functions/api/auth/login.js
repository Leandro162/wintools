import { createSessionCookie } from '../../_auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return json({ error: 'Admin auth is not configured' }, 500);
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const username = String(credentials?.username || '').trim();
  const password = String(credentials?.password || '');

  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
    return json({ error: '用户名或密码不正确' }, 401);
  }

  const cookie = await createSessionCookie(username, env.ADMIN_SESSION_SECRET, request.url);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}
