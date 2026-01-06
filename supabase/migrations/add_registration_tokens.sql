-- Migration: Add registration_tokens table for resident self-registration
-- Run this in your Supabase SQL Editor
-- Updated to handle re-runs safely (drops existing policies if they exist)

-- ============================================
-- Registration Tokens Table
-- ============================================

CREATE TABLE IF NOT EXISTS registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  token TEXTc NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_at TIMESTAMPTZ,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Remove old columns if they exist (from previous migration version)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registration_tokens' AND column_name = 'apartment_number'
  ) THEN
    ALTER TABLE registration_tokens DROP COLUMN apartment_number;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registration_tokens' AND column_name = 'floor_number'
  ) THEN
    ALTER TABLE registration_tokens DROP COLUMN floor_number;
  END IF;
END $$;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_site ON registration_tokens(site_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE registration_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "staff_select_tokens" ON registration_tokens;
DROP POLICY IF EXISTS "staff_insert_tokens" ON registration_tokens;
DROP POLICY IF EXISTS "staff_update_tokens" ON registration_tokens;
DROP POLICY IF EXISTS "staff_delete_tokens" ON registration_tokens;
DROP POLICY IF EXISTS "public_validate_token" ON registration_tokens;

-- Staff (authenticated users) can manage tokens for their sites
CREATE POLICY "staff_select_tokens" ON registration_tokens
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

CREATE POLICY "staff_insert_tokens" ON registration_tokens
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

CREATE POLICY "staff_update_tokens" ON registration_tokens
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

CREATE POLICY "staff_delete_tokens" ON registration_tokens
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND site_id IN (SELECT id FROM sites WHERE user_id = auth.uid())
  );

-- Public can read tokens by token value (for validation during registration)
CREATE POLICY "public_validate_token" ON registration_tokens
  FOR SELECT
  USING (true);

-- ============================================
-- Update tenants table RLS for public registration
-- ============================================

DROP POLICY IF EXISTS "public_register_tenant" ON tenants;

-- Allow inserts from registration flow
CREATE POLICY "public_register_tenant" ON tenants
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Function to get registration URL
-- ============================================

CREATE OR REPLACE FUNCTION get_registration_url(token_id UUID)
RETURNS TEXT AS $$
DECLARE
  token_value TEXT;
BEGIN
  SELECT token INTO token_value FROM registration_tokens WHERE id = token_id;
  IF token_value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN '/resident/register/' || token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
