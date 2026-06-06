import { readSession } from '../src/server/admin-auth.js';

const PROTECTED_PREFIXES = ['/admin/editor', '/api/editor/'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const protectedPath = PROTECTED_PREFIXES.some(prefix => url.pathname.startsWith(prefix));

  if (!protectedPath) return context.next();

  const session = await readSession(context.request, context.env.ADMIN_SESSION_SECRET);
  if (session) return context.next();

  if (url.pathname.startsWith('/api/')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const loginUrl = new URL('/admin/login/', url.origin);
  loginUrl.searchParams.set('next', url.pathname);
  return Response.redirect(loginUrl.toString(), 302);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
