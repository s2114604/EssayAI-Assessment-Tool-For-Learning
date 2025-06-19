/*
  # Fix Essay Grades RLS Policies

  1. Security Updates
    - Drop all existing restrictive policies on essay_grades table
    - Create comprehensive policies that allow proper teacher access
    - Add policies for super_admin access
    - Add policies for student read access to their own grades

  2. Policy Structure
    - Teachers can manage grades for students assigned to them
    - Teachers can manage grades for essays from their assignments
    - Super admins have full access
    - Students can view their own grades
*/

-- Drop all existing policies on essay_grades table
DROP POLICY IF EXISTS "Allow authenticated delete access" ON essay_grades;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON essay_grades;
DROP POLICY IF EXISTS "Allow authenticated read access" ON essay_grades;
DROP POLICY IF EXISTS "Allow authenticated update access" ON essay_grades;
DROP POLICY IF EXISTS "Students can view grades for their own essays" ON essay_grades;
DROP POLICY IF EXISTS "Super admins can manage all grades" ON essay_grades;
DROP POLICY IF EXISTS "Teachers can insert grades for assigned students" ON essay_grades;
DROP POLICY IF EXISTS "Teachers can select grades for assigned students" ON essay_grades;
DROP POLICY IF EXISTS "Teachers can update grades for assigned students" ON essay_grades;
DROP POLICY IF EXISTS "Teachers can manage grades for their students' essays" ON essay_grades;

-- Ensure RLS is enabled
ALTER TABLE essay_grades ENABLE ROW LEVEL SECURITY;

-- Super admin policies (full access)
CREATE POLICY "Super admins can manage all essay grades"
  ON essay_grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Teacher policies for managing grades
CREATE POLICY "Teachers can insert essay grades"
  ON essay_grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teacher'
    )
    AND (
      -- For essays from students assigned to this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN users s ON e.student_id = s.id
        WHERE e.id = essay_grades.essay_id 
        AND s.teacher_id = auth.uid()
      )
      OR
      -- For essays from assignments created by this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN assignments a ON e.assignment_id = a.id
        WHERE e.id = essay_grades.essay_id 
        AND a.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can update essay grades"
  ON essay_grades
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teacher'
    )
    AND (
      -- For essays from students assigned to this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN users s ON e.student_id = s.id
        WHERE e.id = essay_grades.essay_id 
        AND s.teacher_id = auth.uid()
      )
      OR
      -- For essays from assignments created by this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN assignments a ON e.assignment_id = a.id
        WHERE e.id = essay_grades.essay_id 
        AND a.teacher_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teacher'
    )
    AND (
      -- For essays from students assigned to this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN users s ON e.student_id = s.id
        WHERE e.id = essay_grades.essay_id 
        AND s.teacher_id = auth.uid()
      )
      OR
      -- For essays from assignments created by this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN assignments a ON e.assignment_id = a.id
        WHERE e.id = essay_grades.essay_id 
        AND a.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can select essay grades"
  ON essay_grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teacher'
    )
    AND (
      -- For essays from students assigned to this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN users s ON e.student_id = s.id
        WHERE e.id = essay_grades.essay_id 
        AND s.teacher_id = auth.uid()
      )
      OR
      -- For essays from assignments created by this teacher
      EXISTS (
        SELECT 1 FROM essays e
        JOIN assignments a ON e.assignment_id = a.id
        WHERE e.id = essay_grades.essay_id 
        AND a.teacher_id = auth.uid()
      )
    )
  );

-- Student policies for viewing their own grades
CREATE POLICY "Students can view their own essay grades"
  ON essay_grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'student'
    )
    AND EXISTS (
      SELECT 1 FROM essays e
      WHERE e.id = essay_grades.essay_id 
      AND e.student_id = auth.uid()
    )
  );