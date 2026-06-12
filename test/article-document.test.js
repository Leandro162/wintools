import test from 'node:test';
import assert from 'node:assert/strict';

import { buildArticleDocument, parseArticleDocument, sanitizeArticleSlug } from '../src/server/article-document.js';

const article = {
  slug: 'file-renamer',
  title: '文件批量改名工具',
  description: '一次处理几百个文件名',
  category: '文件处理',
  version: 'v1.0.0',
  fileSize: '约 2 MB',
  compatibility: 'Windows 10 / 11（64位）',
  publishDate: '2026-06-11',
  cover: 'https://img.winstools.com/covers/file-renamer/cover-1.webp',
  coverEmoji: '📂',
  tags: ['免安装', '文件管理'],
  featured: true,
  downloadLinks: [{ name: '百度网盘', url: 'https://example.com/file', extractCode: 'abcd' }],
  bodyHtml: '<h2>使用教程</h2><p>正文</p>',
};

test('sanitizes article slugs and rejects traversal', () => {
  assert.equal(sanitizeArticleSlug(' File Renamer '), 'file-renamer');
  assert.equal(sanitizeArticleSlug('../secret'), '');
  assert.equal(sanitizeArticleSlug('文件'), '');
});

test('builds and parses a draft article document', () => {
  const document = buildArticleDocument(article, { draft: true });
  assert.match(document, /^---\n/);
  assert.match(document, /draft: true/);
  assert.match(document, /cover: https:\/\/img\.winstools\.com/);
  assert.match(document, /<h2>使用教程<\/h2>/);

  const parsed = parseArticleDocument(document, article.slug);
  assert.equal(parsed.slug, article.slug);
  assert.equal(parsed.title, article.title);
  assert.equal(parsed.draft, true);
  assert.deepEqual(parsed.tags, article.tags);
  assert.deepEqual(parsed.downloadLinks, article.downloadLinks);
  assert.equal(parsed.bodyHtml, article.bodyHtml);
});

test('removes executable HTML while preserving article formatting', () => {
  const document = buildArticleDocument({
    ...article,
    bodyHtml: [
      '<h2 style="color:red">教程</h2>',
      '<script>alert(1)</script>',
      '<p onclick="alert(2)">正文</p>',
      '<a href="javascript:alert(3)">危险链接</a>',
    ].join(''),
  });

  assert.match(document, /style="color:red"/);
  assert.doesNotMatch(document, /<script|onclick=|javascript:/i);
});
