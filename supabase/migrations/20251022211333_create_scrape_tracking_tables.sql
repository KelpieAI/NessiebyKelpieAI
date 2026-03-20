/*
  # Create Scrape Tracking Tables

  ## Overview
  This migration creates two tables for tracking website scrape attempts:
  - `failed_scrapes`: Tracks failed scrape attempts
  - `successful_scrapes`: Tracks successful scrape attempts

  ## New Tables

  ### `failed_scrapes`
  Stores information about failed website scrape attempts.
  - `id` (uuid, primary key): Unique identifier for the record
  - `website` (text): The URL that failed to scrape
  - `batch_id` (text): Identifier for the batch this scrape belongs to
  - `timestamp` (timestamptz): When the failure occurred
  - `error_code` (text, nullable): Error code from the scraping service
  - `error_message` (text, nullable): Human-readable error description
  - `attempts` (integer): Number of times this scrape has been attempted
  - `status` (text): Current status - 'failed', 'retrying', or 'resolved'
  - `last_updated` (timestamptz): When this record was last modified
  - `created_at` (timestamptz): When this record was first created

  ### `successful_scrapes`
  Stores information about successful website scrape attempts.
  - `id` (uuid, primary key): Unique identifier for the record
  - `website` (text): The URL that was successfully scraped
  - `batch_id` (text): Identifier for the batch this scrape belongs to
  - `timestamp` (timestamptz): When the successful scrape occurred
  - `status` (text): Either 'success' (never failed) or 'resolved' (was failed, then succeeded)
  - `created_at` (timestamptz): When this record was created

  ## Constraints and Indexes
  - Unique constraint on (website, batch_id) combination for both tables to prevent duplicates
  - Indexes on `status` columns for faster filtering
  - Indexes on `timestamp` columns for time-based queries
  - Index on `batch_id` columns for batch-level queries

  ## Security
  1. Enable Row Level Security (RLS) on both tables
  2. Service role has full access to all operations
  3. Anonymous users can read all records from both tables
  4. Anonymous users can update records in failed_scrapes (for UI status changes)
  5. Anonymous users can insert into failed_scrapes (for webhook ingestion)

  ## Important Notes
  - The composite unique key (website + batch_id) ensures we don't create duplicate entries
  - The status field in successful_scrapes differentiates between websites that never failed ('success') and those that recovered from failure ('resolved')
  - All timestamps are stored in UTC format
  - Default values are provided for timestamps and attempt counters to ensure data integrity
*/

-- Create failed_scrapes table
CREATE TABLE IF NOT EXISTS failed_scrapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website text NOT NULL,
  batch_id text NOT NULL,
  timestamp timestamptz NOT NULL,
  error_code text,
  error_message text,
  attempts integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'failed',
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT failed_scrapes_website_batch_unique UNIQUE (website, batch_id),
  CONSTRAINT failed_scrapes_status_check CHECK (status IN ('failed', 'retrying', 'resolved'))
);

-- Create successful_scrapes table
CREATE TABLE IF NOT EXISTS successful_scrapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website text NOT NULL,
  batch_id text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT successful_scrapes_website_batch_unique UNIQUE (website, batch_id),
  CONSTRAINT successful_scrapes_status_check CHECK (status IN ('success', 'resolved'))
);

-- Create indexes for failed_scrapes
CREATE INDEX IF NOT EXISTS idx_failed_scrapes_status ON failed_scrapes(status);
CREATE INDEX IF NOT EXISTS idx_failed_scrapes_timestamp ON failed_scrapes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_failed_scrapes_batch_id ON failed_scrapes(batch_id);

-- Create indexes for successful_scrapes
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_status ON successful_scrapes(status);
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_timestamp ON successful_scrapes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_batch_id ON successful_scrapes(batch_id);

-- Enable Row Level Security
ALTER TABLE failed_scrapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE successful_scrapes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for failed_scrapes
CREATE POLICY "Service role has full access to failed_scrapes"
  ON failed_scrapes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can read failed_scrapes"
  ON failed_scrapes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert failed_scrapes"
  ON failed_scrapes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update failed_scrapes"
  ON failed_scrapes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for successful_scrapes
CREATE POLICY "Service role has full access to successful_scrapes"
  ON successful_scrapes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can read successful_scrapes"
  ON successful_scrapes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert successful_scrapes"
  ON successful_scrapes
  FOR INSERT
  TO anon
  WITH CHECK (true);