import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost } from '../functions/api/editor/generate-cover-prompt.js';

const validEnv = {
  TEXT_AI_API_URL: 'https://api.example.com/v1/chat/completions',
  TEXT_AI_API_KEY: 'server-secret',
  TEXT_AI_MODEL: 'example-model',
};

function request(body) {
  return new Request('https://winstools.com/api/editor/generate-cover-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('requires an article title', async () => {
  const response = await onRequestPost({
    request: request({ title: '', bodyHtml: '<p>正文</p>' }),
    env: validEnv,
    fetchImpl: async () => {
      throw new Error('fetch should not run');
    },
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /标题/);
});

test('reports missing provider configuration', async () => {
  const response = await onRequestPost({
    request: request({ title: '文章标题' }),
    env: {},
    fetchImpl: async () => {
      throw new Error('fetch should not run');
    },
  });

  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /TEXT_AI_API_URL/);
});

test('calls the configured text provider and returns an editable prompt', async () => {
  let providerRequest;
  const response = await onRequestPost({
    request: request({
      title: '文件批量改名工具',
      description: '批量处理文件名',
      category: '文件处理',
      bodyHtml: '<p>拖入文件后设置规则。</p>',
    }),
    env: validEnv,
    fetchImpl: async (url, options) => {
      providerRequest = { url, options };
      return Response.json({
        choices: [{ message: { content: 'A clean 16:9 file management illustration' } }],
      });
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    prompt: 'A clean 16:9 file management illustration',
  });
  assert.equal(providerRequest.url, validEnv.TEXT_AI_API_URL);
  assert.equal(providerRequest.options.headers.Authorization, 'Bearer server-secret');
  assert.equal(JSON.parse(providerRequest.options.body).model, 'example-model');
});

test('returns a concise provider error without exposing credentials', async () => {
  const response = await onRequestPost({
    request: request({ title: '文章标题' }),
    env: validEnv,
    fetchImpl: async () => new Response(
      JSON.stringify({ error: { message: 'provider rejected server-secret request' } }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    ),
  });
  const data = await response.json();

  assert.equal(response.status, 502);
  assert.match(data.error, /provider rejected/);
  assert.doesNotMatch(JSON.stringify(data), /server-secret/);
});
