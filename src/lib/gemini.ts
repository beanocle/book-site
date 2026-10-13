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

// 2026-10 起 gemini-2.5-flash 不再对新用户开放；可用模型以 API 的 models 列表为准。
export const DEFAULT_MODEL = 'gemini-3.5-flash';

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

/** 过载、限流、超时、上游内部错误：换下一个模型重试有意义的错误 */
function isRetryable(err: unknown): boolean {
  if (err instanceof GeminiError) return [429, 500, 503, 504].includes(err.status);
  return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
}

/**
 * 按顺序尝试多个模型：遇到过载 / 限流 / 超时就换下一个，其他错误（密钥无效、请求不合法等）立即抛出。
 * 每个模型单次调用最多等 timeoutMs。返回的 result.model 是实际成功的模型。
 */
export async function generateWithFallback(
  models: string[],
  opts: Omit<GeminiOptions, 'model' | 'signal'>,
  timeoutMs = 25_000,
): Promise<GeminiResult> {
  const list = models.filter(Boolean);
  if (list.length === 0) list.push(DEFAULT_MODEL);
  let lastErr: unknown;
  for (const model of list) {
    try {
      return await generate({ ...opts, model, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      console.warn(`gemini ${model} unavailable, trying next`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  if (lastErr instanceof GeminiError) throw lastErr;
  throw new GeminiError(503, lastErr instanceof Error ? lastErr.message : 'all models unavailable');
}

/** 环境变量 GEMINI_MODEL 可写成逗号分隔的模型链，例如 "gemini-3.5-flash,gemini-3.5-flash-lite" */
export function parseModelChain(value: string | undefined): string[] {
  const list = (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : [DEFAULT_MODEL];
}

export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}
