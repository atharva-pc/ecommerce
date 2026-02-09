-- =====================================================
-- FIX COMMISSION_REQUESTS RLS POLICIES
-- =====================================================
-- Run this in Supabase SQL Editor to fix commissions visibility
-- =====================================================

-- Step 1: Drop all existing policies on commission_requests
DROP POLICY IF EXISTS "Users can view own commission requests" ON commission_requests;
DROP POLICY IF EXISTS "Vendors can view their commissions" ON commission_requests;
DROP POLICY IF EXISTS "Admin can view all commissions" ON commission_requests;
DROP POLICY IF EXISTS "Users can create commission requests" ON commission_requests;
DROP POLICY IF EXISTS "Vendors can update their commissions" ON commission_requests;
DROP POLICY IF EXISTS "Admin can update all commissions" ON commission_requests;

-- Step 2: Create SELECT policies (viewing commissions)

-- Allow customers to view their own commission requests
CREATE POLICY "Users can view own commission requests" ON commission_requests
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

-- Allow vendors to view commissions assigned to them
CREATE POLICY "Vendors can view their commissions" ON commission_requests
FOR SELECT TO authenticated
USING (vendor_id = auth.uid());

-- Allow admins to view all commissions
CREATE POLICY "Admin can view all commissions" ON commission_requests
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Step 3: Create INSERT policies (creating commissions)

-- Allow users to create their own commission requests
CREATE POLICY "Users can create commission requests" ON commission_requests
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Allow admins to create any commission request
CREATE POLICY "Admin can create commissions" ON commission_requests
FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Step 4: Create UPDATE policies (updating commissions)

-- Allow vendors to update commissions assigned to them (for accepting/rejecting)
CREATE POLICY "Vendors can update their commissions" ON commission_requests
FOR UPDATE TO authenticated
USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid());

-- Allow admins to update any commission
CREATE POLICY "Admin can update all commissions" ON commission_requests
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Step 5: Verify policies were created
SELECT
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Operation"
FROM pg_policies
WHERE tablename = 'commission_requests'
ORDER BY policyname;

-- =====================================================
-- DONE! Commissions should now be visible to:
-- - Customers (their own)
-- - Vendors (assigned to them)
-- - Admins (all commissions)
-- =====================================================
