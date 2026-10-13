-- 学习日志：只存事件，不存内容。schema 见 docs/event-schema.md（v1）。
CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  session_id     TEXT NOT NULL,
  ts             TEXT NOT NULL,            -- ISO 8601 UTC
  locale         TEXT NOT NULL,            -- ja / en / zh
  mode           TEXT NOT NULL,            -- course / production
  event          TEXT NOT NULL,
  step           INTEGER,                  -- 0-4，与步骤无关时为 NULL
  payload        TEXT NOT NULL DEFAULT '{}' -- JSON，不含自由文本
);

CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events (session_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events (event, ts);
