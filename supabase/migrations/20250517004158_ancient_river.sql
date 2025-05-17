/*
  # Add RLS policies for emissor table

  1. Changes
    - Enable RLS on emissor table
    - Add policies for authenticated users to:
      - Insert new emissor records
      - Update existing emissor records
      - Delete emissor records
      - Read emissor records
    
  2. Security
    - Only authenticated users can perform CRUD operations
    - Each operation requires the user to be authenticated
    - Policies are permissive to allow operations
*/

-- Enable RLS
ALTER TABLE emissor ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT operations
CREATE POLICY "Allow authenticated users to read emissor"
ON emissor
FOR SELECT
TO authenticated
USING (true);

-- Policy for INSERT operations
CREATE POLICY "Allow authenticated users to insert emissor"
ON emissor
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE operations
CREATE POLICY "Allow authenticated users to update emissor"
ON emissor
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE operations
CREATE POLICY "Allow authenticated users to delete emissor"
ON emissor
FOR DELETE
TO authenticated
USING (true);