# AI Cover And Publishing Implementation Plan

> Superseded note (2026-06-13): Direct Workers AI image generation was replaced by the external OpenAI-compatible text-provider prompt workflow in `docs/superpowers/plans/2026-06-13-external-cover-prompt-provider.md`. Manual image upload, WebP compression, R2 storage, and GitHub publishing remain active.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current paste editor into an authenticated article workflow with real cover images, manual R2 upload, Cloudflare AI generation, GitHub draft storage, and publishing.

**Architecture:** Article metadata and HTML are edited in the browser. Pages Functions protect editor APIs, use an `AI` binding for cover generation, use the existing `WINSTOOLS_IMAGES` R2 binding for images, and use a server-only GitHub token to write Markdown content files. The existing GitHub Action rebuilds and deploys published content.

**Tech Stack:** Astro 6, Cloudflare Pages Functions, Cloudflare Workers AI, Cloudflare R2, GitHub Contents API, Node.js built-in test runner.

---

### Task 1: Real Cover Rendering

**Files:**
- Modify: `src/components/ToolCard.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/category/[category].astro`
- Modify: `src/pages/tools/[slug].astro`

- [ ] Add `cover?: string` to cards and render an `<img>` when present.
- [ ] Keep the current category gradient and emoji as the fallback.
- [ ] Pass `cover` from collections to homepage and category cards.
- [ ] Use `cover` for the detail hero, Open Graph image, and Article JSON-LD.
- [ ] Run `npm run build` and confirm all static routes compile.

### Task 2: Metadata And Manual Cover Upload

**Files:**
- Create: `src/server/image-keys.js`
- Create: `test/image-keys.test.js`
- Modify: `functions/api/editor/upload-image.js`
- Modify: `src/pages/admin/editor.astro`
- Modify: `package.json`

- [ ] Write failing tests for article-image and cover-image R2 keys.
- [ ] Extract and export strict key sanitization.
- [ ] Add title, description, category, version, file size, compatibility, tags, date, featured, and cover controls.
- [ ] Add cover preview, file picker, WebP compression, R2 upload, replace, and clear actions.
- [ ] Run `npm test` and `npm run build`.

### Task 3: Cloudflare AI Cover Generation

**Files:**
- Create: `src/server/cover-prompt.js`
- Create: `test/cover-prompt.test.js`
- Create: `functions/api/editor/generate-cover.js`
- Modify: `src/pages/admin/editor.astro`
- Modify: `docs/README.zh-CN.md`
- Modify: `docs/README.en.md`

- [ ] Write failing tests for deterministic prompt construction and content limits.
- [ ] Build a fixed WinTools visual prompt from article metadata and plain-text content.
- [ ] Call `env.AI.run('@cf/black-forest-labs/flux-1-schnell', ...)`.
- [ ] Return generated image bytes to the browser.
- [ ] Compress the result to WebP, upload it to `covers/<slug>/cover-<timestamp>.webp`, and update the preview.
- [ ] Document the Cloudflare Pages Workers AI binding named `AI`.

### Task 4: GitHub Draft And Publishing

**Files:**
- Create: `src/server/article-document.js`
- Create: `test/article-document.test.js`
- Create: `src/server/github-contents.js`
- Create: `test/github-contents.test.js`
- Create: `functions/api/editor/article.js`
- Create: `functions/api/editor/publish.js`
- Modify: `src/pages/admin/editor.astro`
- Modify: `docs/README.zh-CN.md`
- Modify: `docs/README.en.md`

- [ ] Write failing tests for slug validation, frontmatter escaping, document generation, and GitHub request construction.
- [ ] Generate `src/content/tools/<slug>.md` with metadata, `cover`, `draft`, and HTML body.
- [ ] Add an authenticated endpoint to load an existing generated article by slug.
- [ ] Add an authenticated endpoint to save a draft or publish through the GitHub Contents API.
- [ ] Add Load, Save Draft, and Publish controls with confirmation and status feedback.
- [ ] Document `GITHUB_CONTENT_TOKEN`, `GITHUB_REPOSITORY`, and `GITHUB_BRANCH`.

### Task 5: Verification And Delivery

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm no browser-side secrets or tokens are present.
- [ ] Commit and push through the SSH remote.
- [ ] Confirm GitHub Actions succeeds and production routes remain protected.
