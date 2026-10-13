// Gemini API 的最小客户端（REST，不引第三方 SDK，减少 Worker 体积）。
// 密钥只从 Workers 环境读取；模型名可由 GEMINI_MODEL 覆盖。

export interface GeminiMessage { role: 'user' | 'model'; text: string }

export interface GeminiOptions {
  apiKey: string;
  model?: string;
  system: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  /** 要求模型只输出 JSON（检验者用） */
  json?: boolean;
  signal?: AbortSignal;
}

export interface GeminiResult {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export async function generate(opts: GeminiOptions): Promise<GeminiResult> {
  const model = opts.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new GeminiError(res.status, detail.slice(0, 300));
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) throw new GeminiError(422, `blocked: ${data.promptFeedback.blockReason}`);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return {
    text,
    model,
    tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
    latencyMs,
  };
}

export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}
