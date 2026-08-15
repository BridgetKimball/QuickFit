CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 100000,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE closet_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  base_color TEXT NOT NULL,
  pattern TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  style TEXT NOT NULL,
  skirt_length TEXT NOT NULL DEFAULT '',
  dress_length TEXT NOT NULL DEFAULT '',
  sleeve_length TEXT NOT NULL DEFAULT '',
  jewelry_type TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  photo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_closet_items_user_id ON closet_items(user_id);

CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  temperature_bias TEXT NOT NULL DEFAULT 'neutral',
  profile_style TEXT NOT NULL DEFAULT 'Casual',
  presentation TEXT NOT NULL DEFAULT 'Unspecified'
);

CREATE TABLE favorite_outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planner_json TEXT NOT NULL,
  top_item_id TEXT REFERENCES closet_items(id) ON DELETE SET NULL,
  bottom_item_id TEXT REFERENCES closet_items(id) ON DELETE SET NULL,
  layer_item_id TEXT REFERENCES closet_items(id) ON DELETE SET NULL,
  accessory_item_ids_json TEXT NOT NULL DEFAULT '[]',
  shoes_item_id TEXT REFERENCES closet_items(id) ON DELETE SET NULL,
  tucked_in INTEGER NOT NULL DEFAULT 0,
  jacket_closed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_favorite_outfits_user_id ON favorite_outfits(user_id);
