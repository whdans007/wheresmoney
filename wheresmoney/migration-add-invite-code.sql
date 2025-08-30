-- Migration: Add invite_code column to families table
-- Run this in the Supabase SQL Editor

-- Step 1: Add the invite_code column
ALTER TABLE families ADD COLUMN invite_code TEXT;

-- Step 2: Update existing families with unique invite codes
DO $$
DECLARE
    fam RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR fam IN SELECT id FROM families WHERE invite_code IS NULL LOOP
        LOOP
            -- Generate a 6-digit random code
            new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
            
            -- Check if this code already exists
            SELECT EXISTS(SELECT 1 FROM families WHERE invite_code = new_code) INTO code_exists;
            
            -- If code doesn't exist, use it
            IF NOT code_exists THEN
                UPDATE families SET invite_code = new_code WHERE id = fam.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Make the column NOT NULL and UNIQUE
ALTER TABLE families ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE families ADD CONSTRAINT families_invite_code_unique UNIQUE (invite_code);

-- Step 4: Create index for faster lookups
CREATE INDEX idx_families_invite_code ON families(invite_code);