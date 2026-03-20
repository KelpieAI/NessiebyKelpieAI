/*
  # Add Lead Data Columns to successful_scrapes

  ## Overview
  This migration adds lead-specific data columns to the successful_scrapes table
  to store enriched information from the scraping process.

  ## Changes to Existing Tables

  ### Updates to `successful_scrapes`
  Adds the following columns for storing scraped lead data:
  - `domain` (text, nullable): The domain name extracted from the website
  - `company` (text, nullable): Company name identified during scraping
  - `emails` (jsonb, default []): Array of email addresses found
  - `industry` (text, nullable): Industry classification of the company
  - `icebreaker` (text, nullable): Personalized icebreaker text for outreach

  ## Important Notes
  - All new columns are nullable to maintain backward compatibility with existing records
  - The `emails` field uses JSONB to efficiently store arrays of email addresses
  - Default value for `emails` is an empty JSON array
  - These columns enable rich lead data storage for the outreach system
*/

-- Add lead data columns to successful_scrapes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'domain'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN domain text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'company'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN company text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'emails'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN emails jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'industry'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN industry text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'successful_scrapes' AND column_name = 'icebreaker'
  ) THEN
    ALTER TABLE successful_scrapes ADD COLUMN icebreaker text;
  END IF;
END $$;

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_domain ON successful_scrapes(domain);
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_company ON successful_scrapes(company);
CREATE INDEX IF NOT EXISTS idx_successful_scrapes_industry ON successful_scrapes(industry);