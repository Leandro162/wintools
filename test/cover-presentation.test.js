import test from 'node:test';
import assert from 'node:assert/strict';

import { getCoverPresentation } from '../src/lib/cover-presentation.js';

test('uses a real cover image when cover is present', () => {
  assert.deepEqual(
    getCoverPresentation({
      cover: 'https://img.winstools.com/covers/file-renamer.webp',
      category: '文件处理',
      coverEmoji: '📂',
    }),
    {
      image: 'https://img.winstools.com/covers/file-renamer.webp',
      background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
      emoji: '📂',
    },
  );
});

test('falls back to category background and default emoji', () => {
  assert.deepEqual(
    getCoverPresentation({ category: '其他' }),
    {
      image: '',
      background: 'linear-gradient(135deg,#F8FAFC,#E2E8F0)',
      emoji: '🛠',
    },
  );
});
