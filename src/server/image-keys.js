export function sanitizeImageKey(value) {
  const key = String(value || '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/');

  const articleImage = /^articles\/[a-z0-9-]+\/[a-z0-9._-]+\.webp$/;
  const coverImage = /^covers\/[a-z0-9-]+\/cover-[0-9]+\.webp$/;
  return articleImage.test(key) || coverImage.test(key) ? key : '';
}
