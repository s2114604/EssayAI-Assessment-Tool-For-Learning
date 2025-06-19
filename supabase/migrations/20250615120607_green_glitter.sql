/*
  # Fix User Policies Without JWT Functions

  This migration fixes the user policies by removing references to jwt() and auth.users
  since this application uses custom authentication with the users table directly.

  1. Security Policies
    - Users can read their own profile
    - Users can update their own profile  
    - Allow user registration
    - Super admins have full access
    - Teachers can manage assigned students

  2. Changes
    - Removed jwt() function calls (not available)
    - Removed auth.users references (using custom auth)
    - Simplified policies for custom authentication system
*/

-- Drop ALL existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile via auth" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Teachers can update assigned students" ON users;
DROP POLICY IF EXISTS "Teachers can view assigned students" ON users;

-- Create a simple policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow user registration (insert)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Super admin policy - simplified for custom auth system
CREATE POLICY "Super admins full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'::text
    )
  );

-- Teachers can view assigned students
CREATE POLICY "Teachers can view assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (role = 'student'::text AND teacher_id = auth.uid())
  );

-- Teachers can update assigned students
CREATE POLICY "Teachers can update assigned students"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    (role = 'student'::text AND teacher_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR 
    (role = 'student'::text AND teacher_id = auth.uid())
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;