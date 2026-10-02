-- Run AFTER db/schema.sql:  psql "$DATABASE_URL" -f db/schema.sql -f db/migrations/002_auth.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
