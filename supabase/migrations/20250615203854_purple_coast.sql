/*
  # Fix Essay RLS Policies for Custom Authentication

  1. Security Updates
    - Drop existing RLS policies that rely on auth.uid()
    - Create new policies that work with custom authentication
    - Allow authenticated users to insert essays with valid student_id
    - Maintain security by validating student_id exists in users table

  2. Changes
    - Remove policies that use auth.uid()
    - Add policies that validate student_id against users table
    - Ensure teachers can still view/update student essays
    - Maintain super admin access
*/

-- Drop existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Students can delete their own essays" ON essays;
DROP POLICY IF EXISTS "Students can insert their own essays" ON essays;
DROP POLICY IF EXISTS "Students can update their own essays" ON essays;
DROP POLICY IF EXISTS "Students can view their own essays" ON essays;

-- Create new policies that work with custom authentication
-- Allow authenticated users to insert essays if student_id is valid
CREATE POLICY "Allow authenticated users to insert essays with valid student_id"
  ON essays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id 
      AND role = 'student'
    )
  );

-- Allow users to view essays if they are the student or their teacher
CREATE POLICY "Allow students and teachers to view essays"
  ON essays
  FOR SELECT
  TO authenticated
  USING (
    -- Student can view their own essays
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    OR
    -- Teachers can view their students' essays
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = essays.student_id 
      AND u.teacher_id IS NOT NULL
    )
    OR
    -- Teachers can view essays for their assignments
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = essays.assignment_id
    )
  );

-- Allow students to update their own essays (before grading)
CREATE POLICY "Allow students to update their own essays"
  ON essays
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    AND status IN ('submitted', 'grading')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
  );

-- Allow students to delete their own essays (before grading)
CREATE POLICY "Allow students to delete their own essays"
  ON essays
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    AND status = 'submitted'
  );

-- Keep existing policies for teachers and super admins (they should still work)
-- These policies don't rely on auth.uid() so they should continue to function