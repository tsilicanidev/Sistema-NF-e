/*
  # Fix RLS policies for emissor table

  1. Changes
    - Remove existing RLS policies for emissor table that might be conflicting
    - Add new comprehensive RLS policies for emissor table:
      - Allow authenticated users to read emissor records
      - Allow authenticated users with admin or master role to manage emissor records
      - Allow authenticated users to manage their own emissor records
  
  2. Security
    - Enable RLS on emissor table
    - Add policies for authenticated users
    - Add specific policies for admin/master roles
*/

-- First, remove any existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow all operations for authenticated users on emissor" ON "public"."emissor";
DROP POLICY IF EXISTS "Allow authenticated users to delete emissor" ON "public"."emissor";
DROP POLICY IF EXISTS "Allow authenticated users to insert emissor" ON "public"."emissor";
DROP POLICY IF EXISTS "Allow authenticated users to read emissor" ON "public"."emissor";
DROP POLICY IF EXISTS "Allow authenticated users to update emissor" ON "public"."emissor";

-- Ensure RLS is enabled
ALTER TABLE "public"."emissor" ENABLE ROW LEVEL SECURITY;

-- Add new policies

-- Allow admins and masters to do everything
CREATE POLICY "emissor_admin_master_access" ON "public"."emissor"
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'master')
  )
);

-- Allow all authenticated users to read
CREATE POLICY "emissor_read_access" ON "public"."emissor"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage emissor
CREATE POLICY "emissor_manage_access" ON "public"."emissor"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);