/*
  # Fix Essay Grades RLS Policies

  1. Security Updates
    - Update RLS policies for essay_grades table to allow proper teacher access
    - Ensure teachers can insert grades for their students' essays
    - Ensure teachers can insert grades for essays from their assignments

  2. Policy Changes
    - Add policy for teachers to insert grades for students assigned to them
    - Add policy for teachers to insert grades for essays from their assignments
    - Ensure AI grading can work properly
*/

-- Drop existing restrictive policies that might be blocking inserts
DROP POLICY IF EXISTS "Teachers can manage grades for their students' essays" ON essay_grades;

-- Create comprehensive policies for essay_grades table
CREATE POLICY "Teachers can insert grades for assigned students"
  ON essay_grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essays e
      JOIN users u ON e.student_id = u.id
      WHERE e.id = essay_grades.essay_id 
      AND u.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM essays e
      JOIN assignments a ON e.assignment_id = a.id
      WHERE e.id = essay_grades.essay_id 
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update grades for assigned students"
  ON essay_grades
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e
      JOIN users u ON e.student_id = u.id
      WHERE e.id = essay_grades.essay_id 
      AND u.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM essays e
      JOIN assignments a ON e.assignment_id = a.id
      WHERE e.id = essay_grades.essay_id 
      AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essays e
      JOIN users u ON e.student_id = u.id
      WHERE e.id = essay_grades.essay_id 
      AND u.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM essays e
      JOIN assignments a ON e.assignment_id = a.id
      WHERE e.id = essay_grades.essay_id 
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can select grades for assigned students"
  ON essay_grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e
      JOIN users u ON e.student_id = u.id
      WHERE e.id = essay_grades.essay_id 
      AND u.teacher_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM essays e
      JOIN assignments a ON e.assignment_id = a.id
      WHERE e.id = essay_grades.essay_id 
      AND a.teacher_id = auth.uid()
    )
  );