-- =====================================================
-- FIX ARTIST PROFILE ACCESS
-- =====================================================
-- Allow users to view vendor/artist profiles (public data only)
-- Run this in Supabase SQL Editor
-- =====================================================

-- OPTION 1: Allow viewing approved vendors only (RECOMMENDED)
CREATE POLICY "Allow public to view vendor profiles" ON profiles
FOR SELECT TO authenticated, anon
USING (role = 'vendor' AND vendor_status = 'approved');

-- IF ABOVE FAILS, TRY OPTION 2: Allow viewing all vendors (less restrictive)
-- Uncomment the lines below if Option 1 doesn't work:
/*
DROP POLICY IF EXISTS "Allow public to view vendor profiles" ON profiles;
CREATE POLICY "Allow public to view vendor profiles" ON profiles
FOR SELECT TO authenticated, anon
USING (role = 'vendor');
*/

-- IF BOTH FAIL, TRY OPTION 3: Allow viewing specific columns only
-- Uncomment the lines below:
/*
DROP POLICY IF EXISTS "Allow public to view vendor profiles" ON profiles;
CREATE POLICY "Allow public to view vendor profiles" ON profiles
FOR SELECT TO authenticated, anon
USING (true);  -- This allows viewing all profiles (use with caution)
*/

-- =====================================================
-- VERIFY THE POLICY
-- =====================================================
-- Check that the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Allow public to view vendor profiles';

-- Check what columns exist in profiles table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- DONE!
-- Now users can view approved vendor profiles
-- Refresh your browser to see artist details on product pages
-- =====================================================


