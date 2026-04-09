ALTER TABLE entries DROP CONSTRAINT entries_payment_method_check;
ALTER TABLE entries ADD CONSTRAINT entries_payment_method_check CHECK (payment_method IN ('Venmo', 'Nate', 'Matt', 'Charle', 'Other', 'Free Entry') OR payment_method IS NULL);
