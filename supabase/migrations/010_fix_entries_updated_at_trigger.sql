-- Don't bump updated_at when only total_points changes (score recalculation)
CREATE OR REPLACE FUNCTION update_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip updated_at bump if only total_points changed
  IF (OLD.first_name = NEW.first_name
    AND OLD.last_name = NEW.last_name
    AND OLD.email = NEW.email
    AND OLD.team_name = NEW.team_name
    AND OLD.is_paid IS NOT DISTINCT FROM NEW.is_paid
    AND OLD.payment_method IS NOT DISTINCT FROM NEW.payment_method
    AND OLD.paid_to IS NOT DISTINCT FROM NEW.paid_to
    AND OLD.is_archived IS NOT DISTINCT FROM NEW.is_archived
    AND OLD.referred_by IS NOT DISTINCT FROM NEW.referred_by
  ) THEN
    NEW.updated_at = OLD.updated_at;
  ELSE
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_entries ON entries;
CREATE TRIGGER set_updated_at_entries BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_entries_updated_at();
