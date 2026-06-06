const COOKIE_NAME = 'wt_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function getSessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export async function createSessionCookie(username, secret, requestUrl) {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = base64UrlEncode(JSON.stringify({ u: username, exp }));
  const signature = await sign(payload, secret);
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : '';

  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie(requestUrl) {
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function readSession(request, secret) {
  if (!secret) return null;
  const token = parseCookies(request.headers.get('Cookie') || '')[COOKIE_NAME];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const valid = await verify(payload, signature, secret);
  if (!valid) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload));
    if (!session?.u || !session?.exp || Date.now() > session.exp) return null;
    return { username: session.u, expiresAt: session.exp };
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  return Object.fromEntries(
    header
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

async function sign(payload, secret) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verify(payload, signature, secret) {
  const key = await importKey(secret);
  const expected = base64UrlToBytes(signature);
  return crypto.subtle.verify('HMAC', key, expected, new TextEncoder().encode(payload));
}

function importKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function base64UrlEncode(value) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlDecode(value) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
