# 学习日志事件 schema（v1，草案）

只记录事件，不记录内容。主体是随机会话 ID，不与邮箱或登录身份关联。保存 90 天。
每条记录带 `schema_version`，schema 改动时递增并在此记录差异。

## 记录

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | text | ULID |
| `schema_version` | integer | 本文件的版本，当前 1 |
| `session_id` | text | 浏览器生成的随机 ID，存 localStorage，可由用户清除 |
| `ts` | text | ISO 8601，UTC |
| `locale` | text | ja / en / zh |
| `mode` | text | course / production |
| `event` | text | 见下表 |
| `step` | integer | 0–4，事件发生时所在步骤；与步骤无关时为空 |
| `payload` | text | JSON，按事件定义，**不含用户输入的文本** |

## 事件

| `event` | `payload` | 含义 |
| --- | --- | --- |
| `session_start` | `{ "ua_family": "…" }` | 打开应用 |
| `step_enter` | `{}` | 进入某步 |
| `step_leave` | `{ "chars": 123, "seconds": 45 }` | 离开某步：输入长度与停留时长（不记录内容） |
| `hint_escalate` | `{ "level": 1 \| 2 \| 3 }` | 提示升级：追问 → 指向原理 → 书中案例 |
| `confidence_set` | `{ "value": 0–100 }` | 答前自评信心 |
| `ai_call` | `{ "prompt_version": "…", "model": "…", "tokens_in": n, "tokens_out": n, "latency_ms": n, "verifier": "pass" \| "rewritten" }` | 一次 AI 调用及检验者结果 |
| `principle_select` | `{ "principle": 1–40 }` | 用户选中某条发明原理 |
| `brief_export` | `{ "format": "md" \| "pdf" }` | 导出方案书 |
| `consent_text_log` | `{ "enabled": true \| false }` | 课程模式下用户选择是否记录输入文本（默认 false） |

## 不记录的东西

- 用户输入的问题、方案、任何自由文本（课程模式下经本人勾选 `consent_text_log` 后另表记录，另行说明）
- IP 地址、邮箱、姓名、登录身份
- 精确的键盘事件

## 保存期的实现

Astro 的 Cloudflare 适配器只提供 fetch 入口，没有 cron 入口，所以 90 天清理在每次写入时按约 2% 的概率顺手执行
（`src/lib/events.ts` 的 `maybePurge`）。流量很低时可能延后几天，不影响「最多 90 天 + 少量余量」的承诺。

## 额度保护

`/api/chat` 以 D1 里的 `ai_call` 事件计数做限流：每会话上限 `MAX_CALLS_PER_SESSION`，全站每日上限 `MAX_CALLS_PER_DAY`
（都在 `wrangler.jsonc` 的 vars 里）。这也是日志必须先于 AI 接入的原因之一。

## 变更记录

- v1（2026-10-13）：初稿。
