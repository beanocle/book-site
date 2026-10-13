// POST /api/events —— 前端批量上报学习日志事件。
// 请求体：{ sessionId, locale, events: [{ event, step?, payload?, ts? }, ...] }
// 一次最多 50 条；任一条不合法则整批拒绝（400），不做部分写入，避免悄悄丢失含义。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { insertEvents, LOCALES, maybePurge, normalizeEvent, validateSessionId, type IncomingEvent } from '../../lib/events';

export const prerender = false;

interface Env {
  APP_MODE?: string;
  DB?: D1Database;
}

const MAX_BATCH = 50;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const e = env as unknown as Env;
  if (!e.DB) return json(503, { ok: false, error: 'logging disabled' });

  let body: { sessionId?: unknown; locale?: unknown; events?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid json' });
  }

  if (!validateSessionId(body.sessionId)) return json(400, { ok: false, error: 'bad sessionId' });
  const locale = typeof body.locale === 'string' && (LOCALES as readonly string[]).includes(body.locale) ? body.locale : null;
  if (!locale) return json(400, { ok: false, error: 'bad locale' });
  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > MAX_BATCH) {
    return json(400, { ok: false, error: 'bad batch' });
  }

  const mode = e.APP_MODE === 'production' ? 'production' : 'course';
  const rows = [];
  for (const raw of body.events as IncomingEvent[]) {
    const row = normalizeEvent(raw, { sessionId: body.sessionId, locale, mode });
    if (!row) return json(400, { ok: false, error: 'bad event' });
    rows.push(row);
  }

  await insertEvents(e.DB, rows);
  await maybePurge(e.DB);
  return json(200, { ok: true, accepted: rows.length });
};
