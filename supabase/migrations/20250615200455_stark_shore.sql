/*
  # Update essays table to better support assignment submissions

  1. Changes
    - Make assignment_id more prominent in essays table
    - Add constraint to ensure assignment_id is valid
    - Update indexes for better performance with assignments

  2. New Indexes
    - Composite index on (assignment_id, student_id) for fast lookups
    - Index on (student_id, assignment_id) for student assignment views
*/

-- Add foreign key constraint for assignment_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'essays_assignment_id_fkey'
  ) THEN
    ALTER TABLE essays 
    ADD CONSTRAINT essays_assignment_id_fkey 
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create composite indexes for better assignment-essay performance
CREATE INDEX IF NOT EXISTS idx_essays_assignment_student ON essays(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_essays_student_assignment ON essays(student_id, assignment_id);

-- Update RLS policies to handle assignment-based access better
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Students can manage their own essays" ON essays;
DROP POLICY IF EXISTS "Teachers can view essays from their students" ON essays;
DROP POLICY IF EXISTS "Teachers can update essays from their students" ON essays;

-- Recreate policies with assignment awareness
CREATE POLICY "Students can manage their own essays"
  ON essays
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view essays from their students"
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

CREATE POLICY "Teachers can update essays from their students"
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
  );