-- Add invite_code column to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_families_invite_code ON families(invite_code);

-- Update existing families with random invite codes
UPDATE families 
SET invite_code = LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0')
WHERE invite_code IS NULL;

-- Make invite_code NOT NULL after updating existing records
ALTER TABLE families ALTER COLUMN invite_code SET NOT NULL;