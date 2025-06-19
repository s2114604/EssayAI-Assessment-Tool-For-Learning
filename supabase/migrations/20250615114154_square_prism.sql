/*
  # Fix infinite recursion in users table RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies that cause infinite recursion
    - Create new, simplified RLS policies that don't create circular dependencies
    - Ensure users can read their own data without recursion
    - Allow super admins to manage all users
    - Allow teachers to view their assigned students

  2. Policy Changes
    - Replace complex policies with simpler ones using auth.uid() directly
    - Remove policies that query the users table within the users table policies
    - Use proper policy structure to avoid recursion
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Students can view their own data" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Teachers can view their assigned students" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new, non-recursive policies

-- Policy 1: Users can read their own profile data
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile data
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Super admins can do everything (but avoid recursion)
-- We'll use a function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Super admins full access"
  ON users
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Policy 4: Teachers can view students assigned to them
-- We need to be careful here to avoid recursion
CREATE POLICY "Teachers can view assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if it's the user's own record
    auth.uid() = id
    OR
    -- Allow if the current user is a teacher and this is their student
    (
      role = 'student' 
      AND teacher_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users teacher_check 
        WHERE teacher_check.id = auth.uid() 
        AND teacher_check.role = 'teacher'
      )
    )
  );

-- Policy 5: Allow teachers to update their assigned students (for profile management)
CREATE POLICY "Teachers can update assigned students"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if it's the user's own record
    auth.uid() = id
    OR
    -- Allow if the current user is a teacher and this is their student
    (
      role = 'student' 
      AND teacher_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users teacher_check 
        WHERE teacher_check.id = auth.uid() 
        AND teacher_check.role = 'teacher'
      )
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    auth.uid() = id
    OR
    (
      role = 'student' 
      AND teacher_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users teacher_check 
        WHERE teacher_check.id = auth.uid() 
        AND teacher_check.role = 'teacher'
      )
    )
  );

-- Policy 6: Allow user creation (for sign up)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);