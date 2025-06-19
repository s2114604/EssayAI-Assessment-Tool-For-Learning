/*
  # Fix Assignment RLS Policies for Simple Authentication

  Since we're using simple authentication without auth.uid(), we need to update
  the assignment policies to work with our custom authentication system.

  1. Changes
    - Drop existing policies that use auth.uid()
    - Create permissive policies for authenticated users
    - Handle security at application level
*/

-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Teachers can manage own assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view teacher assignments" ON assignments;
DROP POLICY IF EXISTS "Super admins can manage all assignments" ON assignments;

-- Create permissive policies for simple authentication
CREATE POLICY "Allow authenticated read access"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;