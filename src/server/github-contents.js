const API_ROOT = 'https://api.github.com';

export function parseRepository(value) {
  const match = String(value ?? '').trim().match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]+)$/);
  if (!match || match[2].includes('..')) return null;
  return { owner: match[1], repo: match[2] };
}

export function buildGitHubFileRequest({ repository, branch = 'main', token, path }) {
  const parsed = parseRepository(repository);
  if (!parsed) throw new Error('GITHUB_REPOSITORY 配置无效');
  if (!token) throw new Error('缺少 GITHUB_CONTENT_TOKEN');
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes('..')) throw new Error('GITHUB_BRANCH 配置无效');
  if (!isSafeContentPath(path)) throw new Error('文章文件路径无效');

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return {
    url: `${API_ROOT}/repos/${parsed.owner}/${parsed.repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'WinTools-Editor',
    },
  };
}

export async function getGitHubFile(options) {
  const request = buildGitHubFileRequest(options);
  const response = await fetch(request.url, { headers: request.headers });
  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(githubError(data, '读取 GitHub 文章失败'));
  return data;
}

export async function putGitHubFile(options) {
  const request = buildGitHubFileRequest(options);
  const response = await fetch(request.url.replace(/\?ref=.*$/, ''), {
    method: 'PUT',
    headers: { ...request.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: options.message,
      content: encodeUtf8Base64(options.content),
      branch: options.branch || 'main',
      ...(options.sha ? { sha: options.sha } : {}),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(githubError(data, '写入 GitHub 文章失败'));
  return data;
}

export function decodeUtf8Base64(value) {
  const binary = atob(String(value ?? '').replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function isSafeContentPath(path) {
  const value = String(path ?? '');
  return /^src\/content\/tools\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(value) && !value.includes('..');
}

function githubError(data, fallback) {
  return typeof data?.message === 'string' ? `${fallback}：${data.message}` : fallback;
}
