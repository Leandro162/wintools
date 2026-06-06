import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tinymceSource = resolve(root, 'node_modules/tinymce');
const languageSource = resolve(root, 'node_modules/tinymce-i18n/langs7/zh_CN.js');
const destination = resolve(root, 'public/vendor/tinymce');

await rm(destination, { recursive: true, force: true });
await mkdir(resolve(destination, 'langs'), { recursive: true });

await Promise.all([
  cp(resolve(tinymceSource, 'tinymce.min.js'), resolve(destination, 'tinymce.min.js')),
  cp(resolve(tinymceSource, 'icons'), resolve(destination, 'icons'), { recursive: true }),
  cp(resolve(tinymceSource, 'models'), resolve(destination, 'models'), { recursive: true }),
  cp(resolve(tinymceSource, 'plugins'), resolve(destination, 'plugins'), { recursive: true }),
  cp(resolve(tinymceSource, 'skins'), resolve(destination, 'skins'), { recursive: true }),
  cp(resolve(tinymceSource, 'themes'), resolve(destination, 'themes'), { recursive: true }),
  cp(languageSource, resolve(destination, 'langs/zh_CN.js')),
]);

console.log('TinyMCE assets copied to public/vendor/tinymce');
