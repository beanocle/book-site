// 前端埋点：匿名会话 ID + 事件队列 + 批量上报。只在浏览器里运行。
// 不记录任何用户输入的文本；payload 的键必须在 docs/event-schema.md 的白名单内。

const SESSION_KEY = 'navigator.session';
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 50;

type Payload = Record<string, string | number | boolean>;
interface QueuedEvent { event: string; step?: number | null; payload?: Payload; ts: string }

let queue: QueuedEvent[] = [];
let timer: number | null = null;
let locale = 'ja';
let enabled = true;

function randomId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing && /^[0-9A-Za-z_-]{16,40}$/.test(existing)) return existing;
    const id = randomId();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // 隐私模式等情况：会话 ID 只活在内存里
    return (globalThis as { __navSession?: string }).__navSession ??= randomId();
  }
}

export function resetSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  delete (globalThis as { __navSession?: string }).__navSession;
}

export function initLog(options: { locale: string; enabled?: boolean }): void {
  locale = options.locale;
  enabled = options.enabled ?? true;
  if (typeof window === 'undefined' || !enabled) return;
  log('session_start', null, { ua_family: uaFamily() });
  window.addEventListener('pagehide', () => flush(true));
}

export function log(event: string, step: number | null = null, payload?: Payload): void {
  if (!enabled || typeof window === 'undefined') return;
  queue.push({ event, step, payload, ts: new Date().toISOString() });
  if (queue.length >= MAX_QUEUE) { void flush(); return; }
  if (timer === null) timer = window.setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
}

export async function flush(useBeacon = false): Promise<void> {
  if (timer !== null) { clearTimeout(timer); timer = null; }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  const body = JSON.stringify({ sessionId: getSessionId(), locale, events: batch });
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      return;
    }
    await fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
  } catch {
    // 上报失败不影响使用；丢弃即可，不重试（避免把失败也变成噪音）
  }
}

function uaFamily(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}
