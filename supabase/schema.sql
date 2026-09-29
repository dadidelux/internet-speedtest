-- Speed Test Results Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS speed_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- ISP & plan details
  isp TEXT NOT NULL
    CHECK (isp IN ('Globe','PLDT','Smart','DITO','Converge','Sky','Bayan','Other')),
  plan_type TEXT NOT NULL DEFAULT 'Other',
  promised_mbps NUMERIC(10,2) NOT NULL CHECK (promised_mbps >= 0),

  -- Actual test results
  download_mbps NUMERIC(10,2) NOT NULL CHECK (download_mbps >= 0),
  upload_mbps NUMERIC(10,2) NOT NULL CHECK (upload_mbps >= 0),
  ping_ms NUMERIC(10,2) CHECK (ping_ms >= 0),

  -- Location (precise stored, coarse public)
  street TEXT,
  purok TEXT,
  barangay TEXT NOT NULL DEFAULT 'Bagbag',
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Anti-spam
  device_fingerprint TEXT,
  ip_hash TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_speed_tests_isp ON speed_tests (isp);
CREATE INDEX IF NOT EXISTS idx_speed_tests_barangay ON speed_tests (barangay);
CREATE INDEX IF NOT EXISTS idx_speed_tests_purok ON speed_tests (purok);
CREATE INDEX IF NOT EXISTS idx_speed_tests_created_at ON speed_tests (created_at DESC);

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE speed_tests ENABLE ROW LEVEL SECURITY;

-- Public can insert (form submissions)
CREATE POLICY "Public insert access"
  ON speed_tests FOR INSERT
  WITH CHECK (true);

-- No direct row-level reads — all public access goes through the view
CREATE POLICY "No direct read access"
  ON speed_tests FOR SELECT
  USING (false);

-- =============================================================================
-- Public read view: safe columns only (no lat/lng/fingerprint/ip_hash)
-- =============================================================================
CREATE OR REPLACE VIEW public_speed_tests AS
SELECT
  id,
  isp,
  plan_type,
  promised_mbps,
  download_mbps,
  upload_mbps,
  ping_ms,
  purok,
  barangay,
  created_at
FROM speed_tests;

-- Grant public read on the view
GRANT SELECT ON public_speed_tests TO anon;
GRANT SELECT ON public_speed_tests TO authenticated;

-- Service role can read everything (for admin/QA)
GRANT SELECT, INSERT ON speed_tests TO service_role;
