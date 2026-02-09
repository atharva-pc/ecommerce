-- =====================================================
-- ADD LIMITED EDITION FIELD TO PRODUCTS TABLE
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add is_limited_edition column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN DEFAULT false;

-- Step 2: Mark some existing products as limited edition (for testing)
-- This will mark the first 5 products as limited edition
UPDATE products
SET is_limited_edition = true
WHERE id IN (
  SELECT id FROM products
  ORDER BY created_at DESC
  LIMIT 5
);

-- =====================================================
-- VERIFY RESULTS
-- =====================================================

-- Check if column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'is_limited_edition';

-- Check how many limited edition products we have now
SELECT
  COUNT(*) FILTER (WHERE is_limited_edition = true) as limited_count,
  COUNT(*) as total_count
FROM products;

-- Show the limited edition products
SELECT id, title, price, is_limited_edition
FROM products
WHERE is_limited_edition = true
ORDER BY created_at DESC;

-- =====================================================
-- DONE!
-- - Column added ✓
-- - First 5 products marked as limited edition ✓
-- - Refresh your browser to see them on homepage!
-- =====================================================
