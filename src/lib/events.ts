// 学习日志的服务端：校验、写入 D1、顺手清理过期记录。
// 原则：只收白名单内的事件名与 payload 键，拒绝一切自由文本。schema 见 docs/event-schema.md。

export const SCHEMA_VERSION = 1;
export const RETENTION_DAYS = 90;

export const LOCALES = ['ja', 'en', 'zh'] as const;
export const MODES = ['course', 'production'] as const;

/** 事件名 → 允许的 payload 键与校验 */
const EVENT_PAYLOAD: Record<string, Record<string, (v: unknown) => boolean>> = {
  session_start: { ua_family: (v) => typeof v === 'string' && v.length <= 32 },
  step_enter: {},
  step_leave: { chars: isSmallInt, seconds: isSmallInt },
  hint_escalate: { level: (v) => v === 1 || v === 2 || v === 3 },
  confidence_set: { value: (v) => typeof v === 'number' && v >= 0 && v <= 100 },
  ai_call: {
    prompt_version: (v) => typeof v === 'string' && v.length <= 16,
    model: (v) => typeof v === 'string' && v.length <= 64,
    tokens_in: isSmallInt,
    tokens_out: isSmallInt,
    latency_ms: isSmallInt,
    verifier: (v) => v === 'pass' || v === 'rewritten' || v === 'error',
  },
  principle_select: { principle: (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 40 },
  brief_export: { format: (v) => v === 'md' || v === 'pdf' },
  consent_text_log: { enabled: (v) => typeof v === 'boolean' },
};

function isSmallInt(v: unknown): boolean {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 10_000_000;
}

const SESSION_ID = /^[0-9A-Za-z_-]{16,40}$/;

export interface IncomingEvent {
  event: string;
  step?: number | null;
  payload?: Record<string, unknown>;
  ts?: string;
}

export interface StoredEvent {
  id: string;
  schema_version: number;
  session_id: string;
  ts: string;
  locale: string;
  mode: string;
  event: string;
  step: number | null;
  payload: string;
}

export function validateSessionId(id: unknown): id is string {
  return typeof id === 'string' && SESSION_ID.test(id);
}

/** 校验并规范化一条事件；不合法返回 null。 */
export function normalizeEvent(
  raw: IncomingEvent,
  ctx: { sessionId: string; locale: string; mode: string },
): StoredEvent | null {
  if (!raw || typeof raw.event !== 'string') return null;
  const allowed = EVENT_PAYLOAD[raw.event];
  if (!allowed) return null;

  const payload: Record<string, unknown> = {};
  const given = raw.payload ?? {};
  if (typeof given !== 'object' || Array.isArray(given)) return null;
  for (const [k, v] of Object.entries(given)) {
    const check = allowed[k];
    if (!check) return null; // 未知键一律拒绝，防止夹带文本
    if (!check(v)) return null;
    payload[k] = v;
  }

  let step: number | null = null;
  if (raw.step !== undefined && raw.step !== null) {
    if (!Number.isInteger(raw.step) || raw.step < 0 || raw.step > 4) return null;
    step = raw.step;
  }

  let ts = new Date().toISOString();
  if (typeof raw.ts === 'string') {
    const d = new Date(raw.ts);
    // 客户端时间只在合理范围内采用（前后 1 天），否则用服务器时间
    if (!Number.isNaN(d.getTime()) && Math.abs(Date.now() - d.getTime()) < 86_400_000) ts = d.toISOString();
  }

  return {
    id: crypto.randomUUID(),
    schema_version: SCHEMA_VERSION,
    session_id: ctx.sessionId,
    ts,
    locale: ctx.locale,
    mode: ctx.mode,
    event: raw.event,
    step,
    payload: JSON.stringify(payload),
  };
}

export async function insertEvents(db: D1Database, rows: StoredEvent[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    'INSERT INTO events (id, schema_version, session_id, ts, locale, mode, event, step, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  await db.batch(
    rows.map((r) => stmt.bind(r.id, r.schema_version, r.session_id, r.ts, r.locale, r.mode, r.event, r.step, r.payload)),
  );
}

/** 没有 cron 入口（Astro 适配器只接 fetch），所以在写入时按小概率顺手清理过期记录。 */
export async function maybePurge(db: D1Database, probability = 0.02): Promise<void> {
  if (Math.random() > probability) return;
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  await db.prepare('DELETE FROM events WHERE ts < ?').bind(cutoff).run();
}

export async function countEvents(
  db: D1Database,
  where: { sessionId?: string; event?: string; sinceIso?: string },
): Promise<number> {
  const clauses: string[] = [];
  const binds: unknown[] = [];
  if (where.sessionId) { clauses.push('session_id = ?'); binds.push(where.sessionId); }
  if (where.event) { clauses.push('event = ?'); binds.push(where.event); }
  if (where.sinceIso) { clauses.push('ts >= ?'); binds.push(where.sinceIso); }
  const sql = `SELECT COUNT(*) AS n FROM events${clauses.length ? ' WHERE ' + clauses.join(' AND ') : ''}`;
  const row = await db.prepare(sql).bind(...binds).first<{ n: number }>();
  return row?.n ?? 0;
}
