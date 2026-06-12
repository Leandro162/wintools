import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCoverPrompt } from '../src/server/cover-prompt.js';

test('builds a consistent text-free WinTools cover prompt', () => {
  const prompt = buildCoverPrompt({
    title: '文件批量改名工具',
    description: '一次处理几百个文件名',
    category: '文件处理',
    bodyHtml: '<h2>使用教程</h2><p>拖入文件后设置前缀和序号。</p>',
  });

  assert.match(prompt, /文件批量改名工具/);
  assert.match(prompt, /文件处理/);
  assert.match(prompt, /no text/i);
  assert.doesNotMatch(prompt, /<h2>|<p>/);
});

test('limits article context sent to the image model', () => {
  const prompt = buildCoverPrompt({ title: '工具', bodyHtml: '<p>' + '重复内容'.repeat(2000) + '</p>' });
  assert.ok(prompt.length < 2600);
});
