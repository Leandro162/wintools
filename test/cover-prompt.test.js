import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCoverPromptMessages } from '../src/server/cover-prompt.js';

test('builds consistent system and article messages for the text model', () => {
  const messages = buildCoverPromptMessages({
    title: '文件批量改名工具',
    description: '一次处理几百个文件名',
    category: '文件处理',
    bodyHtml: '<h2>使用教程</h2><p>拖入文件后设置前缀和序号。</p>',
  });
  const prompt = messages.map(message => message.content).join('\n');

  assert.deepEqual(messages.map(message => message.role), ['system', 'user']);
  assert.match(prompt, /文件批量改名工具/);
  assert.match(prompt, /文件处理/);
  assert.match(prompt, /只返回最终提示词/);
  assert.match(prompt, /文字、字母、数字、Logo、品牌标识或水印/);
  assert.doesNotMatch(prompt, /<h2>|<p>/);
});

test('limits article context sent to the image model', () => {
  const prompt = buildCoverPromptMessages({
    title: '工具',
    bodyHtml: '<p>' + '重复内容'.repeat(2000) + '</p>',
  }).map(message => message.content).join('\n');
  assert.ok(prompt.length < 2600);
});
