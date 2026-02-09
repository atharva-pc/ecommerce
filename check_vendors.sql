-- Check if there are vendors in the database
-- Run this in Supabase SQL Editor to see all vendors

SELECT
  id,
  email,
  full_name,
  role,
  vendor_status,
  created_at
FROM profiles
WHERE role = 'vendor'
ORDER BY created_at DESC;

-- This will show you all vendor accounts
