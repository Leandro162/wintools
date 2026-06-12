import { buildArticleDocument, sanitizeArticleSlug } from '../../../src/server/article-document.js';
import { getGitHubFile, putGitHubFile } from '../../../src/server/github-contents.js';

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const mode = payload?.mode === 'publish' ? 'publish' : 'draft';
    const slug = sanitizeArticleSlug(payload?.article?.slug);
    if (!slug) return json({ error: '文章 slug 无效' }, 400);

    const options = githubOptions(context.env, slug);
    const current = await getGitHubFile(options);
    const content = buildArticleDocument(payload.article, { draft: mode !== 'publish' });
    const result = await putGitHubFile({
      ...options,
      content,
      sha: current?.sha,
      message: mode === 'publish' ? `Publish article: ${slug}` : `Save draft: ${slug}`,
    });

    return json({
      ok: true,
      mode,
      commitUrl: result.commit?.html_url,
      fileUrl: result.content?.html_url,
      articleUrl: mode === 'publish'
        ? new URL(`/tools/${slug}/`, context.request.url).href
        : null,
    });
  } catch (error) {
    return json({ error: error.message || '保存文章失败' }, 500);
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
