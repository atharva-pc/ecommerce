-- =====================================================
-- ADD VENDOR PERMISSIONS FOR COMMISSIONS
-- =====================================================
-- Run this in Supabase SQL Editor to fix the 406 errors
-- This allows vendors to view customer profiles for their commissions
-- =====================================================

-- Allow vendors to view profiles of customers who have commissioned them
CREATE POLICY "Vendors can view customer profiles for commissions" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commission_requests
    WHERE commission_requests.customer_id = profiles.id
    AND commission_requests.vendor_id = auth.uid()
  )
);

-- =====================================================
-- VERIFY POLICY WAS CREATED
-- =====================================================
SELECT
  policyname as "Policy Name",
  cmd as "Operation"
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Vendors can view customer profiles for commissions';

-- =====================================================
-- DONE! Vendors can now see customer details for their commissions
-- Refresh your browser and the 406 errors should be gone!
-- =====================================================
