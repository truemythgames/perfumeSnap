CREATE TABLE IF NOT EXISTS collection_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  perfume_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collection_user_created
  ON collection_items (user_id, created_at DESC);
