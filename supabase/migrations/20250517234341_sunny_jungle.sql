/*
  # Fix emissor table RLS policies

  1. Changes
    - Drop existing RLS policies for emissor table
    - Add new policies that properly handle initialization and management
    - Ensure authenticated users can create initial emissor record
    - Maintain security while allowing necessary operations

  2. Security
    - Enable RLS on emissor table
    - Add policies for:
      - Reading emissor data
      - Creating initial emissor record
      - Managing emissor data by admins/masters
*/

-- Drop existing policies
DROP POLICY IF EXISTS "emissor_admin_master_access" ON "public"."emissor";
DROP POLICY IF EXISTS "emissor_manage_access" ON "public"."emissor";
DROP POLICY IF EXISTS "emissor_read_access" ON "public"."emissor";

-- Create new policies
CREATE POLICY "emissor_read_all"
ON "public"."emissor"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "emissor_create_initial"
ON "public"."emissor"
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM "public"."emissor"
  )
);

CREATE POLICY "emissor_manage_admin_master"
ON "public"."emissor"
FOR ALL
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