import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTextAIRequest, parseTextAIResponse } from '../src/server/text-ai-provider.js';

const messages = [
  { role: 'system', content: 'Return only a prompt.' },
  { role: 'user', content: 'Article context' },
];

test('builds an authenticated OpenAI-compatible request', () => {
  const request = buildTextAIRequest({
    apiUrl: 'https://api.example.com/v1/chat/completions',
    apiKey: 'secret-key',
    model: 'example-model',
    messages,
  });

  assert.equal(request.url, 'https://api.example.com/v1/chat/completions');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer secret-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    model: 'example-model',
    messages,
    temperature: 0.7,
  });
});

test('rejects incomplete or insecure provider configuration', () => {
  assert.throws(
    () => buildTextAIRequest({ apiUrl: 'http://api.example.com', apiKey: 'key', model: 'model', messages }),
    /HTTPS/,
  );
  assert.throws(
    () => buildTextAIRequest({ apiUrl: 'https://api.example.com', apiKey: '', model: 'model', messages }),
    /TEXT_AI_API_KEY/,
  );
  assert.throws(
    () => buildTextAIRequest({ apiUrl: 'https://api.example.com', apiKey: 'key', model: '', messages }),
    /TEXT_AI_MODEL/,
  );
});

test('parses prompt text and removes Markdown fences', () => {
  assert.equal(
    parseTextAIResponse({
      choices: [{ message: { content: '~~~text\nA clean Windows utility cover\n~~~'.replaceAll('~', String.fromCharCode(96)) } }],
    }),
    'A clean Windows utility cover',
  );
});

test('rejects malformed or empty model responses', () => {
  assert.throws(() => parseTextAIResponse({ choices: [] }), /有效的提示词/);
  assert.throws(
    () => parseTextAIResponse({ choices: [{ message: { content: '   ' } }] }),
    /有效的提示词/,
  );
});
