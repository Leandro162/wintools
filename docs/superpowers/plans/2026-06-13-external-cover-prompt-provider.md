# External Cover Prompt Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct Workers AI image generation with an OpenAI-compatible text endpoint that generates an editable cover-image prompt while preserving manual cover upload, compression, and R2 storage.

**Architecture:** A focused server helper validates provider settings, builds a Chat Completions request, and parses the provider response. A protected Pages Function receives article metadata and calls that helper. The editor displays the returned prompt in an editable textarea with copy and upload controls; image processing continues through the existing browser-to-R2 pipeline.

**Tech Stack:** Astro 6, Cloudflare Pages Functions, OpenAI-compatible Chat Completions API, Cloudflare R2, Node.js built-in test runner.

---

### Task 1: Text Provider Adapter

**Files:**
- Create: `src/server/text-ai-provider.js`
- Create: `test/text-ai-provider.test.js`
- Modify: `src/server/cover-prompt.js`
- Modify: `test/cover-prompt.test.js`

- [ ] **Step 1: Write failing adapter tests**

Test that `buildTextAIRequest()` accepts an HTTPS URL and returns an authenticated Chat Completions request containing the configured model, system instruction, article context, and `temperature: 0.7`.

Test that invalid or missing URL, key, and model values throw configuration errors.

Test that `parseTextAIResponse()` returns `choices[0].message.content`, removes Markdown fences, and rejects empty or malformed responses.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test test/text-ai-provider.test.js test/cover-prompt.test.js
```

Expected: failure because `src/server/text-ai-provider.js` and the new prompt-message export do not exist.

- [ ] **Step 3: Implement minimal provider and prompt helpers**

Add:

```js
export function buildTextAIRequest({ apiUrl, apiKey, model, messages }) {}
export function parseTextAIResponse(payload) {}
```

Update `cover-prompt.js` to export:

```js
export function buildCoverPromptMessages(article) {
  return [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    { role: 'user', content: buildArticleContext(article) },
  ];
}
```

The user context must strip HTML and cap article body text at 1,600 characters.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test test/text-ai-provider.test.js test/cover-prompt.test.js
```

Expected: all focused tests pass.

---

### Task 2: Protected Prompt API

**Files:**
- Create: `functions/api/editor/generate-cover-prompt.js`
- Delete: `functions/api/editor/generate-cover.js`
- Create: `test/generate-cover-prompt.test.js`

- [ ] **Step 1: Write failing API tests**

Test the exported handler with an injected `fetch` implementation:

- Missing title returns `400`.
- Missing provider configuration returns `500`.
- A valid request sends the expected provider payload and returns `{ prompt }`.
- A provider error returns a concise non-secret error response.

- [ ] **Step 2: Run API tests and verify RED**

Run:

```bash
node --test test/generate-cover-prompt.test.js
```

Expected: failure because the new Pages Function does not exist.

- [ ] **Step 3: Implement the Pages Function**

Read:

```text
TEXT_AI_API_URL
TEXT_AI_API_KEY
TEXT_AI_MODEL
```

Call the configured endpoint with `fetch`, pass the messages produced by `buildCoverPromptMessages()`, parse the JSON response, and return:

```json
{ "prompt": "..." }
```

Never return provider credentials or raw request headers.

- [ ] **Step 4: Remove direct Workers AI image endpoint**

Delete `functions/api/editor/generate-cover.js`. The `AI` binding must no longer be referenced by production code.

- [ ] **Step 5: Run API tests and verify GREEN**

Run:

```bash
node --test test/generate-cover-prompt.test.js
```

Expected: all API tests pass.

---

### Task 3: Editor Prompt Workflow

**Files:**
- Modify: `src/pages/admin/editor.astro`

- [ ] **Step 1: Replace direct image generation UI**

In the cover panel:

- Add editable `textarea#coverPromptInput`.
- Rename the action to **生成首图提示词**.
- Add **复制提示词**.
- Rename image selection to **上传生成的图片**.

- [ ] **Step 2: Replace browser behavior**

The generation button must POST article title, description, category, and current editor HTML to `/api/editor/generate-cover-prompt`, then place `data.prompt` in the textarea.

The copy button must copy the current textarea value and reject an empty prompt with a clear status.

The upload button must continue using `compressCoverToWebp()` and `uploadToR2()` without changes to output dimensions, quality, object key, or preview behavior.

- [ ] **Step 3: Verify editor source**

Run:

```bash
rg -n "generate-cover|env\\.AI|AI 生成首图" src functions
```

Expected: no direct image-generation references remain; only `generate-cover-prompt` references are present.

---

### Task 4: Deployment Documentation

**Files:**
- Modify: `docs/README.zh-CN.md`
- Modify: `docs/README.en.md`
- Modify: `docs/superpowers/plans/2026-06-10-ai-cover-publishing.md`

- [ ] **Step 1: Replace Cloudflare AI configuration**

Remove the Workers AI `AI` binding requirement and document:

```text
TEXT_AI_API_URL=https://provider.example/v1/chat/completions
TEXT_AI_MODEL=provider-model-name
TEXT_AI_API_KEY=encrypted provider secret
```

- [ ] **Step 2: Document the editor workflow**

Explain prompt generation, editing, copying, external image generation, upload, 1280 x 720 center crop, WebP conversion, and R2 storage in both languages.

- [ ] **Step 3: Mark the superseded plan**

Add a short note to the previous plan stating that direct Workers AI image generation was replaced by the external text-provider prompt workflow defined in this plan.

---

### Task 5: Verification And Delivery

**Files:**
- Verify all changed files

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: zero failures.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Astro builds all static routes successfully.

- [ ] **Step 3: Verify Pages Function imports**

```bash
node -e "Promise.all([import('./functions/api/editor/generate-cover-prompt.js'), import('./functions/api/editor/article.js'), import('./functions/api/editor/publish.js')]).then(() => console.log('Pages Function imports: OK'))"
```

- [ ] **Step 4: Verify secret isolation**

Search `dist/`, `src/pages/`, and `public/` for `TEXT_AI_API_KEY`. It may appear only in server documentation or server configuration code, never generated frontend output.

- [ ] **Step 5: Commit and push**

Commit the implementation, push through the SSH remote using `~/.ssh/id_ed25519_github`, then confirm `main...origin/main` is `0 0`.
