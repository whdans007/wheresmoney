# URGENT: Apply This SQL Migration

## The app is currently broken because the `invite_code` column doesn't exist in the families table.

### How to Fix:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: psabukfqimeyrisbcleh 
3. **Go to SQL Editor** (left sidebar)
4. **Copy and paste this SQL** and click "RUN":

```sql
-- Add invite_code column to families table
ALTER TABLE families ADD COLUMN invite_code TEXT;

-- Update existing families with unique invite codes
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

-- Make the column required and unique
ALTER TABLE families ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE families ADD CONSTRAINT families_invite_code_unique UNIQUE (invite_code);

-- Create index for performance
CREATE INDEX idx_families_invite_code ON families(invite_code);
```

### After running the SQL:
- The app will work immediately
- Family creation will work
- Invite system will work perfectly
- Existing families will get random invite codes

**This must be done to fix the app!**