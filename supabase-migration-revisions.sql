-- Add revision tracking to report_versions
-- Run this in Supabase SQL editor
ALTER TABLE report_versions ADD COLUMN IF NOT EXISTS revision int DEFAULT 1 NOT NULL;
ALTER TABLE report_versions ADD COLUMN IF NOT EXISTS revision_note text;
