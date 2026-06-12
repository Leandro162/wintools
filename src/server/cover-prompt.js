const MAX_CONTEXT_LENGTH = 1600;

export function buildCoverPrompt({ title = '', description = '', category = '其他', bodyHtml = '' }) {
  const context = stripHtml(bodyHtml).slice(0, MAX_CONTEXT_LENGTH);
  return [
    'Create a polished 16:9 editorial cover image for a Chinese Windows utility tutorial website.',
    'Visual style: clean modern software illustration, realistic UI-inspired objects, bright neutral background, crisp details, professional technology publication, balanced composition, one clear focal subject.',
    'No text, letters, numbers, logos, watermarks, brand marks, window title bars, or illegible glyphs. Keep important objects inside the center safe area.',
    `Article title: ${clean(title, 180)}`,
    `Category: ${clean(category, 60)}`,
    `Summary: ${clean(description, 320)}`,
    `Article context: ${context}`,
  ].filter(line => !line.endsWith(': ')).join('\n');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(value, limit) {
  return stripHtml(value).slice(0, limit);
}
