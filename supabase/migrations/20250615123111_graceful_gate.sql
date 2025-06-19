/*
  # Fix RLS policies for simple authentication system

  1. Remove all auth.uid() based policies since we're not using Supabase auth
  2. Create simple policies that allow public access with application-level security
  3. Enable RLS but make it permissive for our custom auth system
*/

-- Drop all existing policies that use auth.uid()
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Teachers can update assigned students" ON users;
DROP POLICY IF EXISTS "Teachers can view assigned students" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- For simple authentication, we'll use more permissive policies
-- and handle security at the application level

-- Allow authenticated users to read users table
CREATE POLICY "Allow authenticated read access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update users table
CREATE POLICY "Allow authenticated update access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert into users table
CREATE POLICY "Allow authenticated insert access"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete from users table (for admin functions)
CREATE POLICY "Allow authenticated delete access"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;