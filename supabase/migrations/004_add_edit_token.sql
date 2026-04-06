-- Add edit_token column for magic link team editing
ALTER TABLE entries ADD COLUMN edit_token TEXT;

-- Generate tokens for any existing entries
UPDATE entries SET edit_token = encode(gen_random_bytes(16), 'hex') WHERE edit_token IS NULL;

-- Make it not null with a default for future entries
ALTER TABLE entries ALTER COLUMN edit_token SET DEFAULT encode(gen_random_bytes(16), 'hex');
