/*
  # Create assignments table for teacher-student assignment system

  1. New Tables
    - `assignments`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `instructions` (text, optional) - Detailed instructions for students
      - `due_date` (timestamptz, not null)
      - `max_score` (integer, default 100)
      - `teacher_id` (uuid, not null) - References users table
      - `file_url` (text, optional) - Assignment file URL
      - `file_name` (text, optional) - Assignment file name
      - `file_size` (integer, optional) - File size in bytes
      - `is_active` (boolean, default true) - Whether assignment is active
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `assignments` table
    - Teachers can manage their own assignments
    - Students can view assignments from their assigned teacher
    - Super admins can manage all assignments

  3. Indexes
    - Index on teacher_id for fast teacher assignment lookups
    - Index on due_date for sorting by deadline
    - Index on is_active for filtering active assignments
*/

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  due_date timestamptz NOT NULL,
  max_score integer DEFAULT 100,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url text,
  file_name text,
  file_size integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_is_active ON assignments(is_active);

-- Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for assignment access control

-- Teachers can manage their own assignments
CREATE POLICY "Teachers can manage own assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Students can view assignments from their assigned teacher
CREATE POLICY "Students can view teacher assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'student' 
      AND u.teacher_id = assignments.teacher_id
    )
  );

-- Super admins can manage all assignments
CREATE POLICY "Super admins can manage all assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();