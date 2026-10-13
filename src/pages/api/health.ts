// 健康检查：确认 Worker 在跑、环境变量读得到、密钥已配置（只报有无，不报值）。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

interface Env {
  APP_MODE?: string;
  PROMPT_VERSION?: string;
  GEMINI_API_KEY?: string;
}

export const GET: APIRoute = () => {
  const e = env as unknown as Env;
  const body = {
    ok: true,
    mode: e.APP_MODE ?? 'unknown',
    promptVersion: e.PROMPT_VERSION ?? '0',
    geminiKeyConfigured: Boolean(e.GEMINI_API_KEY),
    time: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
};
