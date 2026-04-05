-- RLS Policies

ALTER TABLE tournament_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE composition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_golfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE golfer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE golfer_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_fetch_log ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read access (leaderboard, entry form need to read these)
CREATE POLICY "Public read tournament_config" ON tournament_config FOR SELECT USING (true);
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public read golfers" ON golfers FOR SELECT USING (true);
CREATE POLICY "Public read composition_rules" ON composition_rules FOR SELECT USING (true);
CREATE POLICY "Public read entries" ON entries FOR SELECT USING (true);
CREATE POLICY "Public read entry_golfers" ON entry_golfers FOR SELECT USING (true);
CREATE POLICY "Public read golfer_scores" ON golfer_scores FOR SELECT USING (true);
CREATE POLICY "Public read golfer_results" ON golfer_results FOR SELECT USING (true);

-- Public insert for team submissions (server-side validated)
CREATE POLICY "Public insert entries" ON entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert entry_golfers" ON entry_golfers FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin all tournament_config" ON tournament_config FOR ALL USING (is_admin());
CREATE POLICY "Admin all admin_users" ON admin_users FOR ALL USING (is_admin());
CREATE POLICY "Admin all groups" ON groups FOR ALL USING (is_admin());
CREATE POLICY "Admin all golfers" ON golfers FOR ALL USING (is_admin());
CREATE POLICY "Admin all composition_rules" ON composition_rules FOR ALL USING (is_admin());
CREATE POLICY "Admin all entries" ON entries FOR ALL USING (is_admin());
CREATE POLICY "Admin all entry_golfers" ON entry_golfers FOR ALL USING (is_admin());
CREATE POLICY "Admin all golfer_scores" ON golfer_scores FOR ALL USING (is_admin());
CREATE POLICY "Admin all golfer_results" ON golfer_results FOR ALL USING (is_admin());
CREATE POLICY "Admin all score_fetch_log" ON score_fetch_log FOR ALL USING (is_admin());
CREATE POLICY "Admin read admin_users" ON admin_users FOR SELECT USING (is_admin());
