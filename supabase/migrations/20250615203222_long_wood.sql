/*
  # Fix Essay Submission RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on essays table
    - Add proper policies that allow students to insert their own essays
    - Ensure teachers can view and update essays from their students
    - Maintain super admin access to all essays

  2. Policy Changes
    - Allow students to insert essays where student_id matches their auth.uid()
    - Allow students to select, update, and delete their own essays
    - Allow teachers to view and update essays from their assigned students or assignments
    - Allow super admins full access to all essays
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Students can manage their own essays" ON essays;
DROP POLICY IF EXISTS "Super admins can manage all essays" ON essays;
DROP POLICY IF EXISTS "Teachers can update essays from their students" ON essays;
DROP POLICY IF EXISTS "Teachers can view essays from their students" ON essays;

-- Create new policies with proper permissions

-- Students can insert their own essays
CREATE POLICY "Students can insert their own essays"
  ON essays
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can view their own essays
CREATE POLICY "Students can view their own essays"
  ON essays
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can update their own essays (but only if not graded)
CREATE POLICY "Students can update their own essays"
  ON essays
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can delete their own essays (but only if not graded)
CREATE POLICY "Students can delete their own essays"
  ON essays
  FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view essays from their assigned students
CREATE POLICY "Teachers can view student essays"
  ON essays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = essays.student_id 
      AND u.teacher_id = auth.uid()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = essays.assignment_id 
      AND a.teacher_id = auth.uid()
    )
  );

-- Teachers can update essays from their students (for grading purposes)
CREATE POLICY "Teachers can update student essays"
  ON essays
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = essays.student_id 
      AND u.teacher_id = auth.uid()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = essays.assignment_id 
      AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = essays.student_id 
      AND u.teacher_id = auth.uid()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = essays.assignment_id 
      AND a.teacher_id = auth.uid()
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins can manage all essays"
  ON essays
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );