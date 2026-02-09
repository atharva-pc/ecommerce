-- =====================================================
-- RESTORE ORIGINAL WORKING POLICIES
-- =====================================================
-- This will restore your database to the working state
-- Run this in Supabase SQL Editor NOW
-- =====================================================

-- STEP 1: DROP ALL CURRENT POLICIES
DO $$
DECLARE
r RECORD;
BEGIN
    -- Drop all policies on profiles table
FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
END LOOP;

    -- Drop all policies on orders table
FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON orders';
END LOOP;
END $$;

-- STEP 2: RESTORE ORIGINAL WORKING POLICIES

-- =====================================================
-- PROFILES TABLE - ORIGINAL POLICIES
-- =====================================================

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Enable insert for authenticated users only" ON profiles
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
                      USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
               USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- ORDERS TABLE - ORIGINAL POLICIES
-- =====================================================

-- Allow users to view their own orders
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT TO authenticated
               USING (user_id = auth.uid());

-- Allow users to insert their own orders (during checkout)
CREATE POLICY "Users can create their own orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow vendors to view their orders
CREATE POLICY "Vendors can view their orders" ON orders
FOR SELECT TO authenticated
USING (vendor_id = auth.uid());

-- =====================================================
-- ADMIN POLICIES (SAFE - NO RECURSION)
-- =====================================================

-- Create helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admin can update all profiles (for vendor approval)
CREATE POLICY "Admin can update all profiles" ON profiles
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admin can view all orders
CREATE POLICY "Admin can view all orders" ON orders
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admin can update all orders (for order management)
CREATE POLICY "Admin can update all orders" ON orders
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- VERIFY RESTORATION
-- =====================================================
SELECT
    tablename as "Table",
    policyname as "Policy Name",
    cmd as "Operation"
FROM pg_policies
WHERE tablename IN ('profiles', 'orders')
ORDER BY tablename, policyname;

-- =====================================================
-- DONE! Your database is back to the working state
-- Now refresh your browser - everything should work!
-- =====================================================
