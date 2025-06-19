/*
  # Fix RLS Policies to Resolve Infinite Recursion

  This migration fixes the infinite recursion issue in the users table RLS policies
  by creating simpler policies that don't cause circular dependencies.

  ## Changes
  1. Drop all existing problematic policies
  2. Create simple, non-recursive policies
  3. Use direct auth.uid() comparisons instead of complex subqueries
  4. Separate policies for different access patterns
*/

-- Drop all existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Super admins full access" ON users;
DROP POLICY IF EXISTS "Teachers can update assigned students" ON users;
DROP POLICY IF EXISTS "Teachers can view assigned students" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Basic policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Basic policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow new user registration (for sign up)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Teachers can view students assigned to them (simplified)
CREATE POLICY "Teachers can view assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (role = 'student' AND teacher_id = auth.uid())
  );

-- Teachers can update students assigned to them (simplified)
CREATE POLICY "Teachers can update assigned students"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    (role = 'student' AND teacher_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR 
    (role = 'student' AND teacher_id = auth.uid())
  );

-- Super admin access (simplified - will be handled at application level)
-- Note: For now, super admins will use service role key for full access
-- This avoids the infinite recursion issue while maintaining security

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;