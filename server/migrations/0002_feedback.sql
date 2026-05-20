CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  perfume_name TEXT NOT NULL,
  perfume_brand TEXT NOT NULL,
  satisfied INTEGER NOT NULL,  -- 1 = yes, 0 = no
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_created
  ON feedback (created_at DESC);
