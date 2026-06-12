import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeImageKey } from '../src/server/image-keys.js';

test('accepts article WebP image keys', () => {
  assert.equal(
    sanitizeImageKey('articles/file-renamer/001.webp'),
    'articles/file-renamer/001.webp',
  );
});

test('accepts versioned cover WebP image keys', () => {
  assert.equal(
    sanitizeImageKey('/covers/file-renamer/cover-1710000000000.webp'),
    'covers/file-renamer/cover-1710000000000.webp',
  );
});

test('rejects traversal, unsupported types, and invalid slugs', () => {
  assert.equal(sanitizeImageKey('../covers/file/cover.webp'), '');
  assert.equal(sanitizeImageKey('covers/file/cover.png'), '');
  assert.equal(sanitizeImageKey('covers/文件/cover.webp'), '');
});
