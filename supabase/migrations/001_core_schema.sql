-- Masters Pool Manager - Core Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tournament configuration (one row per year)
CREATE TABLE tournament_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Masters Pool',
  entry_fee DECIMAL(10,2) DEFAULT 20.00,
  entry_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'open', 'closed', 'in_progress', 'completed')),
  espn_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users (allowlisted Google OAuth emails)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (admin-configurable per tournament: 1A, A, B, C, D, E, F, etc.)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  picks_required INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, name)
);

-- Golfers in the field
CREATE TABLE golfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  world_ranking INT,
  region TEXT CHECK (region IN ('United States', 'Europe', 'International')),
  age_category TEXT CHECK (age_category IN ('Under 30', 'Over 40') OR age_category IS NULL),
  is_rookie BOOLEAN DEFAULT FALSE,
  is_amateur BOOLEAN DEFAULT FALSE,
  espn_athlete_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, name)
);

CREATE INDEX idx_golfers_tournament ON golfers(tournament_id);
CREATE INDEX idx_golfers_group ON golfers(group_id);

-- Composition rules (configurable team constraints)
CREATE TABLE composition_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  min_count INT NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submitted team entries
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  team_name TEXT NOT NULL,
  total_points INT DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_method TEXT CHECK (payment_method IN ('Venmo', 'PayPal', 'Cash', 'Other') OR payment_method IS NULL),
  paid_to TEXT,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, email)
);

CREATE INDEX idx_entries_tournament_points ON entries(tournament_id, total_points DESC);

-- Junction: which golfers are on which entry
CREATE TABLE entry_golfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(entry_id, golfer_id)
);

CREATE INDEX idx_entry_golfers_entry ON entry_golfers(entry_id);
CREATE INDEX idx_entry_golfers_golfer ON entry_golfers(golfer_id);

-- Per-round scoring data for each golfer
CREATE TABLE golfer_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 4),
  total_strokes INT,
  score_to_par INT,
  hole_scores INT[],
  hole_pars INT[],
  eagles INT DEFAULT 0,
  double_eagles INT DEFAULT 0,
  holes_in_one INT DEFAULT 0,
  is_best_round_of_day BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual' CHECK (source IN ('espn', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(golfer_id, round_number)
);

CREATE INDEX idx_golfer_scores_tournament ON golfer_scores(tournament_id);

-- Tournament-level results per golfer
CREATE TABLE golfer_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  final_position INT,
  total_strokes INT,
  total_score_to_par INT,
  made_cut BOOLEAN DEFAULT FALSE,
  is_best_round_of_tournament BOOLEAN DEFAULT FALSE,
  tournament_points INT DEFAULT 0,
  daily_points INT DEFAULT 0,
  total_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(golfer_id, tournament_id)
);

-- Score fetch audit log
CREATE TABLE score_fetch_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournament_config(id) ON DELETE CASCADE,
  round_number INT,
  status TEXT NOT NULL,
  golfers_updated INT DEFAULT 0,
  error_message TEXT,
  raw_response JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tournament_config BEFORE UPDATE ON tournament_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_groups BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_golfers BEFORE UPDATE ON golfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_entries BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_golfer_scores BEFORE UPDATE ON golfer_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_golfer_results BEFORE UPDATE ON golfer_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
