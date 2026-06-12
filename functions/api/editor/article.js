import { parseArticleDocument, sanitizeArticleSlug } from '../../../src/server/article-document.js';
import { decodeUtf8Base64, getGitHubFile } from '../../../src/server/github-contents.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const slug = sanitizeArticleSlug(url.searchParams.get('slug'));
    if (!slug) return json({ error: '文章 slug 无效' }, 400);

    const file = await getGitHubFile(githubOptions(context.env, slug));
    if (!file) return json({ error: '没有找到这篇文章' }, 404);

    const article = parseArticleDocument(decodeUtf8Base64(file.content), slug);
    return json({ article, sha: file.sha, htmlUrl: file.html_url });
  } catch (error) {
    return json({ error: error.message || '读取文章失败' }, 500);
  }
}

function githubOptions(env, slug) {
  return {
    repository: env.GITHUB_REPOSITORY || 'Leandro162/wintools',
    branch: env.GITHUB_BRANCH || 'main',
    token: env.GITHUB_CONTENT_TOKEN,
    path: `src/content/tools/${slug}.md`,
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
