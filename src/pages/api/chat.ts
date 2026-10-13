// POST /api/chat —— 回答者 + 检验者的双 LLM 调用。
// 请求体：{ sessionId, locale, step (0-4), stepName, userInput, confidence?, history?: [{role, text}] }
// 响应：{ ok, text, verifier: 'pass'|'rewritten', promptVersion, model, usage }
//
// 约束（见 CLAUDE.md「课程约束」）：AI 不给完整方案、不替用户选原理；检验者不通过则改写成提问。
// 额度保护：每会话最多 MAX_CALLS_PER_SESSION 次，全站每日最多 MAX_CALLS_PER_DAY 次（按 D1 里的 ai_call 事件计数）。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generate, GeminiError, DEFAULT_MODEL } from '../../lib/gemini';
import { criteriaText, fill, promptVersion, responderPrompt, verifierPrompt } from '../../lib/prompts';
import { countEvents, insertEvents, LOCALES, normalizeEvent, validateSessionId } from '../../lib/events';

export const prerender = false;

interface Env {
  APP_MODE?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  MAX_CALLS_PER_SESSION?: string;
  MAX_CALLS_PER_DAY?: string;
  DB?: D1Database;
}

const MAX_INPUT_CHARS = 4000;
const MAX_HISTORY = 10;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

interface ChatBody {
  sessionId?: unknown;
  locale?: unknown;
  step?: unknown;
  stepName?: unknown;
  userInput?: unknown;
  confidence?: unknown;
  history?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as unknown as Env;
  if (!e.GEMINI_API_KEY) return json(503, { ok: false, error: 'GEMINI_API_KEY not configured' });

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return json(400, { ok: false, error: 'invalid json' });
  }

  if (!validateSessionId(body.sessionId)) return json(400, { ok: false, error: 'bad sessionId' });
  const locale = typeof body.locale === 'string' && (LOCALES as readonly string[]).includes(body.locale) ? body.locale : 'ja';
  const step = Number.isInteger(body.step) && (body.step as number) >= 0 && (body.step as number) <= 4 ? (body.step as number) : null;
  if (step === null) return json(400, { ok: false, error: 'bad step' });
  const stepName = typeof body.stepName === 'string' ? body.stepName.slice(0, 80) : `step ${step + 1}`;
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  if (!userInput) return json(400, { ok: false, error: 'empty input' });
  if (userInput.length > MAX_INPUT_CHARS) return json(413, { ok: false, error: 'input too long' });
  const confidence = typeof body.confidence === 'number' && body.confidence >= 0 && body.confidence <= 100 ? Math.round(body.confidence) : null;
  const history = Array.isArray(body.history)
    ? (body.history as Array<{ role?: unknown; text?: unknown }>)
        .filter((m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role as 'user' | 'model', text: (m.text as string).slice(0, MAX_INPUT_CHARS) }))
    : [];

  // 额度保护
  const perSession = Number(e.MAX_CALLS_PER_SESSION ?? 30);
  const perDay = Number(e.MAX_CALLS_PER_DAY ?? 200);
  if (e.DB) {
    const [sessionCalls, dayCalls] = await Promise.all([
      countEvents(e.DB, { sessionId: body.sessionId, event: 'ai_call' }),
      countEvents(e.DB, { event: 'ai_call', sinceIso: new Date(Date.now() - 86_400_000).toISOString() }),
    ]);
    if (sessionCalls >= perSession) return json(429, { ok: false, error: 'session quota exceeded' });
    if (dayCalls >= perDay) return json(429, { ok: false, error: 'daily quota exceeded' });
  }

  const model = e.GEMINI_MODEL || DEFAULT_MODEL;
  const responderTemplate = responderPrompt(locale);
  const version = promptVersion(responderTemplate);
  const system = fill(responderTemplate, {
    STEP: `${step + 1}. ${stepName}`,
    CRITERIA: criteriaText(locale),
    USER_INPUT: userInput,
    CONFIDENCE: confidence === null ? '（未入力）' : String(confidence),
  });

  const messages = [...history, { role: 'user' as const, text: userInput }];
  const started = Date.now();
  let verifierResult: 'pass' | 'rewritten' | 'error' = 'error';
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const answer = await generate({ apiKey: e.GEMINI_API_KEY, model, system, messages, temperature: 0.4, maxOutputTokens: 800 });
    tokensIn += answer.tokensIn;
    tokensOut += answer.tokensOut;

    // 检验者：低温度、JSON 输出
    const verifierSystem = fill(verifierPrompt(locale), { STEP: `${step + 1}. ${stepName}` });
    let text = answer.text;
    try {
      const v = await generate({
        apiKey: e.GEMINI_API_KEY,
        model,
        system: verifierSystem,
        messages: [{ role: 'user', text: answer.text }],
        temperature: 0,
        maxOutputTokens: 600,
        json: true,
      });
      tokensIn += v.tokensIn;
      tokensOut += v.tokensOut;
      const parsed = JSON.parse(v.text) as { verdict?: string; rewritten?: string };
      if (parsed.verdict === 'rewrite' && typeof parsed.rewritten === 'string' && parsed.rewritten.trim()) {
        text = parsed.rewritten.trim();
        verifierResult = 'rewritten';
      } else {
        verifierResult = 'pass';
      }
    } catch {
      // 检验者失败时保守处理：不把未经检验的回答放出去，改为固定的提问
      verifierResult = 'error';
      text = fallbackQuestion(locale);
    }

    await logAiCall(e, body.sessionId, locale, step, {
      prompt_version: version,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: Date.now() - started,
      verifier: verifierResult,
    });

    return json(200, {
      ok: true,
      text,
      verifier: verifierResult,
      promptVersion: version,
      model,
      usage: { tokensIn, tokensOut, latencyMs: Date.now() - started },
    });
  } catch (err) {
    const status = err instanceof GeminiError ? (err.status === 429 ? 429 : 502) : 500;
    const message = err instanceof Error ? err.message : 'unknown error';
    await logAiCall(e, body.sessionId, locale, step, {
      prompt_version: version, model, tokens_in: tokensIn, tokens_out: tokensOut, latency_ms: Date.now() - started, verifier: 'error',
    });
    return json(status, { ok: false, error: message });
  }
};

async function logAiCall(
  e: Env,
  sessionId: string,
  locale: string,
  step: number,
  payload: Record<string, string | number>,
): Promise<void> {
  if (!e.DB) return;
  const row = normalizeEvent({ event: 'ai_call', step, payload }, {
    sessionId,
    locale,
    mode: e.APP_MODE === 'production' ? 'production' : 'course',
  });
  if (row) await insertEvents(e.DB, [row]).catch(() => undefined);
}

function fallbackQuestion(locale: string): string {
  switch (locale) {
    case 'en': return 'The checker could not confirm this answer. Before we continue: what exactly would you want to be true at the end, and what gets worse if you push for it?';
    case 'zh': return '检验者没能确认这条回答。先回到你的输入：你最终希望成立的是什么？追求它时，什么会变差？';
    default: return '検証器がこの回答を確認できませんでした。入力に戻りましょう。最終的に成り立ってほしいことは何ですか。それを追うと、何が悪化しますか。';
  }
}
