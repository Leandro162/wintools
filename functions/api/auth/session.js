import { readSession } from '../../../src/server/admin-auth.js';

export async function onRequestGet({ request, env }) {
  const session = await readSession(request, env.ADMIN_SESSION_SECRET);

  if (!session) {
    return json({ authenticated: false }, 401);
  }

  return json({
    authenticated: true,
    username: session.username,
    expiresAt: session.expiresAt,
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
