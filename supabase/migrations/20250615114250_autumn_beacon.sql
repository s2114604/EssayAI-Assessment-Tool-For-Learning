/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies are causing infinite recursion when checking user roles
    - The `is_super_admin()` function and teacher-student checks are creating circular dependencies

  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid recursion by using auth.uid() directly
    - Simplify policy logic to prevent circular references

  3. New Policies
    - Users can read their own profile
    - Users can update their own profile  
    - Teachers can view their assigned students
    - Teachers can update their assigned students
    - Super admins have full access (using direct role check)
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Teachers can update assigned students" ON users;
DROP POLICY IF EXISTS "Teachers can view assigned students" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies without recursion

-- Allow users to read their own profile
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

-- Teachers can view their assigned students
CREATE POLICY "Teachers can view assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- User can see themselves OR
    auth.uid() = id OR
    -- User is a student assigned to the current teacher
    (role = 'student' AND teacher_id = auth.uid())
  );

-- Teachers can update their assigned students
CREATE POLICY "Teachers can update assigned students"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update themselves OR
    auth.uid() = id OR
    -- User is a student assigned to the current teacher
    (role = 'student' AND teacher_id = auth.uid())
  )
  WITH CHECK (
    -- User can update themselves OR
    auth.uid() = id OR
    -- User is a student assigned to the current teacher
    (role = 'student' AND teacher_id = auth.uid())
  );

-- Super admins have full access (using service role or direct check)
-- Note: This policy should be used carefully and may need adjustment based on your auth setup
CREATE POLICY "Super admins full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    -- Check if current user has super_admin role directly from auth metadata
    -- or if they are a service role
    (auth.jwt() ->> 'role')::text = 'service_role' OR
    -- Direct role check without recursion
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data ->> 'role' = 'super_admin'
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.id = auth.uid() 
      AND au.raw_user_meta_data ->> 'role' = 'super_admin'
    )
  );