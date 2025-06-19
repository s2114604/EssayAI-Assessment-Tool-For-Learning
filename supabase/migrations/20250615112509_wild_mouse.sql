/*
  # Create essay grades table for AI and teacher grading

  1. New Tables
    - `essay_grades`
      - `id` (uuid, primary key)
      - `essay_id` (uuid, not null) - References essays table
      - `total_score` (integer, not null)
      - `max_score` (integer, default 100)
      - `criteria_scores` (jsonb) - Breakdown of scores by criteria
      - `feedback` (text) - Detailed feedback
      - `graded_by` (text) - 'ai' or 'teacher'
      - `teacher_id` (uuid, optional) - If graded by teacher
      - `graded_at` (timestamptz, default now)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `essay_grades` table
    - Students can view grades for their own essays
    - Teachers can manage grades for their students' essays
    - Super admins can manage all grades
*/

-- Create essay_grades table
CREATE TABLE IF NOT EXISTS essay_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  total_score integer NOT NULL,
  max_score integer DEFAULT 100,
  criteria_scores jsonb NOT NULL DEFAULT '{}',
  feedback text,
  graded_by text NOT NULL CHECK (graded_by IN ('ai', 'teacher')),
  teacher_id uuid REFERENCES users(id) ON DELETE SET NULL,
  graded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_essay_grades_essay_id ON essay_grades(essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_grades_teacher_id ON essay_grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_essay_grades_graded_by ON essay_grades(graded_by);

-- Enable Row Level Security
ALTER TABLE essay_grades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can view grades for their own essays"
  ON essay_grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e 
      WHERE e.id = essay_id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage grades for their students' essays"
  ON essay_grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.id = essay_id AND u.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all grades"
  ON essay_grades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_essay_grades_updated_at
  BEFORE UPDATE ON essay_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();