import { parse, stringify } from 'yaml';

const CATEGORIES = new Set(['文件处理', '系统优化', '效率工具', '网络工具', '其他']);

export function sanitizeArticleSlug(value) {
  const source = String(value ?? '').trim().toLowerCase();
  if (!source || source.includes('..') || /[\\/]/.test(source)) return '';

  const slug = source
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80 ? slug : '';
}

export function buildArticleDocument(article, { draft = true } = {}) {
  const normalized = normalizeArticle(article, draft);
  const { slug, bodyHtml, ...frontmatter } = normalized;
  return `---\n${stringify(frontmatter, { lineWidth: 0 })}---\n\n${bodyHtml}\n`;
}

export function parseArticleDocument(document, slug) {
  const match = String(document ?? '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('文章文件缺少有效的 YAML frontmatter');

  const data = parse(match[1]) ?? {};
  const publishDate = normalizeDate(data.publishDate);
  return {
    slug: sanitizeArticleSlug(slug),
    ...data,
    publishDate,
    tags: Array.isArray(data.tags) ? data.tags : [],
    downloadLinks: Array.isArray(data.downloadLinks) ? data.downloadLinks : [],
    draft: Boolean(data.draft),
    bodyHtml: match[2].trim(),
  };
}

function normalizeArticle(article, draft) {
  const slug = sanitizeArticleSlug(article?.slug);
  if (!slug) throw new Error('文章 slug 只能使用小写英文字母、数字和连字符');

  const title = requiredText(article.title, '文章标题');
  const description = requiredText(article.description, '文章简介');
  const category = requiredText(article.category, '分类');
  if (!CATEGORIES.has(category)) throw new Error('文章分类无效');

  const publishDate = normalizeDate(article.publishDate);
  if (!publishDate) throw new Error('发布日期无效');

  const downloadLinks = normalizeDownloadLinks(article.downloadLinks);
  const cover = optionalHttpsUrl(article.cover, '首图地址');
  const bodyHtml = sanitizeBodyHtml(requiredText(article.bodyHtml, '文章正文'));

  return {
    slug,
    title,
    description,
    category,
    version: requiredText(article.version, '版本'),
    fileSize: requiredText(article.fileSize, '文件大小'),
    compatibility: requiredText(article.compatibility, '兼容系统'),
    publishDate,
    ...(cover ? { cover } : {}),
    ...(String(article.coverEmoji ?? '').trim() ? { coverEmoji: String(article.coverEmoji).trim() } : {}),
    featured: Boolean(article.featured),
    tags: Array.isArray(article.tags)
      ? article.tags.map(tag => String(tag).trim()).filter(Boolean).slice(0, 20)
      : [],
    downloadLinks,
    draft: Boolean(draft),
    bodyHtml,
  };
}

function normalizeDownloadLinks(links) {
  if (!Array.isArray(links) || links.length === 0) throw new Error('至少需要一个下载地址');
  return links.slice(0, 10).map((link) => {
    const name = requiredText(link?.name, '下载名称');
    const url = optionalHttpsUrl(link?.url, '下载地址');
    if (!url) throw new Error('下载地址不能为空');
    const extractCode = String(link?.extractCode ?? '').trim();
    return { name, url, ...(extractCode ? { extractCode } : {}) };
  });
}

function requiredText(value, label) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label}不能为空`);
  return text;
}

function optionalHttpsUrl(value, label) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${label}无效`);
  }
  if (url.protocol !== 'https:') throw new Error(`${label}必须使用 HTTPS`);
  return url.toString();
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function sanitizeBodyHtml(html) {
  return html
    .replace(/<\s*(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '');
}
