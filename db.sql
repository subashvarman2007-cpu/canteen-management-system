-- SJC Canteen — Database schema
-- St. Joseph's College, Trichy
-- Run this in Supabase SQL Editor or via psql

CREATE TABLE IF NOT EXISTS sjc_users (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name   TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sjc_users ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to read (login lookup) and insert (self-registration).
CREATE POLICY "anon_select_sjc_users" ON sjc_users
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_sjc_users" ON sjc_users
  FOR INSERT TO anon, authenticated WITH CHECK (true);
