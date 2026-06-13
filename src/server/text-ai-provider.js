export function buildTextAIRequest({ apiUrl, apiKey, model, messages }) {
  const url = validateApiUrl(apiUrl);
  const key = String(apiKey ?? '').trim();
  const modelName = String(model ?? '').trim();

  if (!key) throw new Error('缺少 TEXT_AI_API_KEY');
  if (!modelName) throw new Error('缺少 TEXT_AI_MODEL');
  if (!Array.isArray(messages) || messages.length === 0) throw new Error('提示词消息不能为空');

  return {
    url,
    options: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
      }),
    },
  };
}

export function parseTextAIResponse(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('文本模型没有返回有效的提示词');

  const prompt = content
    .trim()
    .replace(/^```(?:[a-z0-9_-]+)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  if (!prompt) throw new Error('文本模型没有返回有效的提示词');
  return prompt;
}

function validateApiUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error('缺少 TEXT_AI_API_URL');

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error('TEXT_AI_API_URL 无效');
  }
  if (url.protocol !== 'https:') throw new Error('TEXT_AI_API_URL 必须使用 HTTPS');
  return url.href;
}
