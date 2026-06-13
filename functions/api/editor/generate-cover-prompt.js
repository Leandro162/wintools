import { buildCoverPromptMessages } from '../../../src/server/cover-prompt.js';
import { buildTextAIRequest, parseTextAIResponse } from '../../../src/server/text-ai-provider.js';

export async function onRequestPost({ request, env, fetchImpl = fetch }) {
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: '请求内容不是有效的 JSON' }, 400);
  }

  if (!String(input?.title || '').trim()) return json({ error: '请先填写文章标题' }, 400);

  let providerRequest;
  try {
    providerRequest = buildTextAIRequest({
      apiUrl: env.TEXT_AI_API_URL,
      apiKey: env.TEXT_AI_API_KEY,
      model: env.TEXT_AI_MODEL,
      messages: buildCoverPromptMessages(input),
    });
  } catch (error) {
    return json({ error: error.message || '文本模型配置无效' }, 500);
  }

  try {
    const response = await fetchImpl(providerRequest.url, providerRequest.options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = redactSecret(
        String(data?.error?.message || data?.message || '文本模型请求失败'),
        env.TEXT_AI_API_KEY,
      );
      return json({ error: `文本模型请求失败：${message}` }, 502);
    }
    return json({ prompt: parseTextAIResponse(data) });
  } catch (error) {
    return json({ error: error.message || '文本模型请求失败' }, 502);
  }
}

function redactSecret(message, secret) {
  const value = String(secret || '');
  return value ? message.replaceAll(value, '[REDACTED]') : message;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
