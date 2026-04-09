ALTER TABLE tournament_config ADD COLUMN auto_fetch_paused BOOLEAN DEFAULT false;
ALTER TABLE score_fetch_log ADD COLUMN source TEXT DEFAULT 'manual';
