export async function onRequestPost() {
  return new Response(JSON.stringify({
    error: 'Remote image localization is not enabled yet. Paste base64 or clipboard images first, or upload images manually.',
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
