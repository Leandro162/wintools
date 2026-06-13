const MAX_CONTEXT_LENGTH = 1600;

const SYSTEM_INSTRUCTION = [
  '你是一名专业的科技媒体视觉提示词设计师。',
  '请根据文章内容生成一条可直接用于图片生成模型的首图提示词。',
  '画面要求：16:9 横版，现代 Windows 工具教程主题，干净明亮，专业、清晰，有一个明确视觉主体，重要内容位于中央安全区域。',
  '画面中不要出现任何文字、字母、数字、Logo、品牌标识或水印。',
  '只返回最终提示词，不要解释，不要使用 Markdown 代码块。',
].join('\n');

export function buildCoverPromptMessages({
  title = '',
  description = '',
  category = '其他',
  bodyHtml = '',
}) {
  const context = stripHtml(bodyHtml).slice(0, MAX_CONTEXT_LENGTH);
  const articleContext = [
    `文章标题：${clean(title, 180)}`,
    `文章分类：${clean(category, 60)}`,
    `文章简介：${clean(description, 320)}`,
    `正文摘要：${context}`,
  ].filter(line => !line.endsWith('：')).join('\n');

  return [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    { role: 'user', content: articleContext },
  ];
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
