import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGitHubFileRequest, decodeUtf8Base64, parseRepository } from '../src/server/github-contents.js';

test('parses an owner/repository setting', () => {
  assert.deepEqual(parseRepository('Leandro162/wintools'), { owner: 'Leandro162', repo: 'wintools' });
  assert.equal(parseRepository('../bad'), null);
});

test('builds an authenticated GitHub contents request', () => {
  const request = buildGitHubFileRequest({
    repository: 'Leandro162/wintools',
    branch: 'main',
    token: 'secret',
    path: 'src/content/tools/file-renamer.md',
  });
  assert.equal(request.url, 'https://api.github.com/repos/Leandro162/wintools/contents/src/content/tools/file-renamer.md?ref=main');
  assert.equal(request.headers.Authorization, 'Bearer secret');
});

test('decodes GitHub UTF-8 file content', () => {
  assert.equal(decodeUtf8Base64(Buffer.from('中文正文').toString('base64')), '中文正文');
});
