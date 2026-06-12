# External AI Cover Prompt Provider Design

## Goal

Replace direct Cloudflare Workers AI image generation with a model-agnostic text workflow:

1. Finish editing an article.
2. Click **生成首图提示词**.
3. Receive an AI-generated image prompt in an editable text area.
4. Copy the prompt into any external image-generation tool.
5. Upload the generated image back to WinTools.
6. Crop, compress, convert to WebP, upload to R2, and publish as the article cover.

## User Experience

The existing **文章首图** panel will contain:

- A cover preview.
- An editable multiline prompt field.
- **生成首图提示词** button.
- **复制提示词** button.
- **上传生成的图片** button.
- **清除首图** button.

Generating a prompt does not upload or generate an image. Uploading an image continues to use the existing browser-side pipeline:

- Center-crop to 16:9.
- Resize to 1280 x 720.
- Encode as WebP at approximately 84% quality.
- Upload to `covers/<slug>/cover-<timestamp>.webp` in Cloudflare R2.
- Store the resulting public URL in article frontmatter.

## Provider Interface

The browser calls a protected Pages Function:

```text
POST /api/editor/generate-cover-prompt
```

Request body:

```json
{
  "title": "Article title",
  "description": "Article summary",
  "category": "文件处理",
  "bodyHtml": "<h2>...</h2>"
}
```

Success response:

```json
{
  "prompt": "Generated image prompt"
}
```

The Pages Function calls an OpenAI-compatible Chat Completions endpoint:

```text
POST {TEXT_AI_API_URL}
Authorization: Bearer {TEXT_AI_API_KEY}
Content-Type: application/json
```

Request shape:

```json
{
  "model": "{TEXT_AI_MODEL}",
  "messages": [
    { "role": "system", "content": "Fixed WinTools cover prompt instructions" },
    { "role": "user", "content": "Article metadata and condensed plain text" }
  ],
  "temperature": 0.7
}
```

The adapter reads the generated text from:

```text
choices[0].message.content
```

## Cloudflare Configuration

Required server-side variables:

```text
TEXT_AI_API_URL=https://provider.example/v1/chat/completions
TEXT_AI_API_KEY=provider-secret
TEXT_AI_MODEL=provider-model-name
```

`TEXT_AI_API_KEY` must be stored as an encrypted Cloudflare secret. None of these credentials are returned to browser code or committed to GitHub.

The endpoint URL is configurable rather than constructed from a fixed host. This supports OpenAI and other providers that expose the same Chat Completions request and response format.

## Prompt Construction

The server will send:

- Article title.
- Description.
- Category.
- A length-limited plain-text version of the article body.
- Fixed visual requirements:
  - 16:9 editorial cover.
  - Windows utility/tutorial subject.
  - One clear visual focus.
  - No text, letters, numbers, logos, brands, or watermarks.
  - Important content inside the central safe area.

The text model returns only the final image-generation prompt, without explanations or Markdown fences.

## Validation And Errors

- The existing admin session middleware protects the endpoint.
- Title is required.
- Article context is length-limited before being sent to the provider.
- The provider URL must use HTTPS.
- Missing provider variables produce a clear configuration error.
- Provider errors are converted into concise editor status messages.
- Empty or malformed model responses are rejected.
- The generated prompt remains editable even after generation.

## Scope Changes

Remove:

- Direct `env.AI.run(...)` image generation.
- The Cloudflare Workers AI `AI` binding requirement.
- Automatic upload immediately after AI generation.

Keep:

- Manual cover upload.
- Browser-side crop, resize, and WebP compression.
- R2 image storage and preview.
- Cover URL publishing and frontend cover rendering.

## Verification

- Unit tests for provider configuration, request construction, response parsing, and malformed responses.
- Unit tests for article context stripping and length limits.
- Astro production build.
- Pages Function module import check.
- Confirm no API key is present in generated frontend assets.
