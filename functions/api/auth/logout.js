import { clearSessionCookie } from '../../../src/server/admin-auth.js';

export async function onRequestPost({ request }) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': clearSessionCookie(request.url),
    },
  });
}
