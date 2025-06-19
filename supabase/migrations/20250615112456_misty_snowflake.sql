/*
  # Create essays table for essay submissions

  1. New Tables
    - `essays`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `content` (text, optional) - Essay content if typed directly
      - `file_url` (text, optional) - URL to uploaded file
      - `file_name` (text, optional) - Original filename
      - `file_size` (integer, optional) - File size in bytes
      - `student_id` (uuid, not null) - References users table
      - `assignment_id` (uuid, optional) - References assignments table
      - `submitted_at` (timestamptz, default now)
      - `status` (text, default 'submitted') - submitted, grading, graded, returned
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `essays` table
    - Students can only access their own essays
    - Teachers can access essays from their assigned students
    - Super admins can access all essays
*/

-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  file_url text,
  file_name text,
  file_size integer,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id uuid,
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'grading', 'graded', 'returned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_essays_student_id ON essays(student_id);
CREATE INDEX IF NOT EXISTS idx_essays_assignment_id ON essays(assignment_id);
CREATE INDEX IF NOT EXISTS idx_essays_status ON essays(status);
CREATE INDEX IF NOT EXISTS idx_essays_submitted_at ON essays(submitted_at);

-- Enable Row Level Security
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

-- Create policies
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
      WHERE u.id = student_id AND u.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update essays from their students"
  ON essays
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = student_id AND u.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all essays"
  ON essays
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_essays_updated_at
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();