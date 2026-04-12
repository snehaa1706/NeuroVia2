-- Add missing profile columns to users table
-- These columns are needed for doctor profiles (bio, specialty, location, experience, gender)

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
