/*
  # Create Batches Table and Update Scrape Tables

  ## Overview
  This migration creates the batches table for tracking lead processing campaigns
  and adds batch_uuid foreign keys to successful_scrapes and failed_scrapes tables.

  ## New Tables

  ### `batches`
  Stores batch information for lead processing campaigns.
  - `id` (uuid, primary key): Unique identifier for the batch
  - `owner_user_id` (uuid, nullable): User who created the batch
  - `label` (text): Batch name/label
  - `created_at` (timestamptz): When the batch was created
  - `status` (text): Batch processing status - 'pending', 'processing', 'complete'
  - `total_urls` (integer): Total number of URLs in the batch
  - `processed_urls` (integer): Number of URLs processed so far
  - `channel` (text, nullable): Channel type (email, dm, etc.)
  - `subject_template` (text, nullable): Template for message subject
  - `body_template` (text, nullable): Template for message body

  ## Changes to Existing Tables

  ### Updates to `successful_scrapes`
  - Add `batch_uuid` (uuid, nullable): Foreign key to batches.id
  - Add `owner_user_id` (uuid, nullable): User who owns this lead

  ### Updates to `failed_scrapes`
  - Add `batch_uuid` (uuid, nullable): Foreign key to batches.id
  - Add `owner_user_id` (uuid, nullable): User who owns this lead

  ## Indexes
  - Index on batches.owner_user_id for fast user queries
  - Index on batches.status for filtering by status
  - Index on successful_scrapes.batch_uuid for batch queries
  - Index on failed_scrapes.batch_uuid for batch queries

  ## Security
  1. Enable RLS on batches table
  2. Policies allow authenticated users to manage their own batches
  3. Anonymous users can insert/update for webhook ingestion
  4. Service role has full access

  ## Important Notes
  - The batch_uuid field links scrapes to the batches table
  - The existing batch_id field (text) is preserved for backward compatibility
  - All new fields are nullable to maintain backward compatibility
  - Status field has a check constraint to ensure valid values
*/

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  total_urls integer NOT NULL DEFAULT 0,
  processed_urls integer NOT NULL DEFAULT 0,
  channel text,
  subject_template text,
  body_template text,
  CONSTRAINT batches_status_check CHECK (status IN ('pending', 'processing', 'complete'))
);

-- Add new columns to successful_scrapes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'batch_uuid'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN batch_uuid uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN owner_user_id uuid;
  END IF;
END $$;

-- Add new columns to failed_scrapes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'failed_scrapes' AND column_name = 'batch_uuid'
  ) THEN
    ALTER TABLE failed_scrapes ADD COLUMN batch_uuid uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'failed_scrapes' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE failed_scrapes ADD COLUMN owner_user_id uuid;
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'successful_scrapes_batch_uuid_fkey'
  ) THEN
    ALTER TABLE successful_scrapes 
    ADD CONSTRAINT successful_scrapes_batch_uuid_fkey 
    FOREIGN KEY (batch_uuid) REFERENCES batches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'failed_scrapes_batch_uuid_fkey'
  ) THEN
    ALTER TABLE failed_scrapes 
    ADD CONSTRAINT failed_scrapes_batch_uuid_fkey 
    FOREIGN KEY (batch_uuid) REFERENCES batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for batches
CREATE INDEX IF NOT EXISTS idx_batches_owner_user_id ON batches(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON batches(created_at DESC);

-- Create indexes for scrapes batch_uuid
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_batch_uuid ON successful_scrapes(batch_uuid);
CREATE INDEX IF NOT EXISTS idx_failed_scrapes_batch_uuid ON failed_scrapes(batch_uuid);

-- Enable Row Level Security
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batches
CREATE POLICY "Service role has full access to batches"
  ON batches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can read batches"
  ON batches
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert batches"
  ON batches
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update batches"
  ON batches
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage own batches"
  ON batches
  FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid() OR owner_user_id IS NULL)
  WITH CHECK (owner_user_id = auth.uid() OR owner_user_id IS NULL);