/*
  # Create plagiarism reports table for plagiarism detection

  1. New Tables
    - `plagiarism_reports`
      - `id` (uuid, primary key)
      - `essay_id` (uuid, not null) - References essays table
      - `similarity_percentage` (integer, not null)
      - `sources` (jsonb) - Array of matched sources
      - `status` (text, default 'checking') - checking, completed, failed
      - `checked_at` (timestamptz, default now)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `plagiarism_reports` table
    - Students can view reports for their own essays
    - Teachers can view reports for their students' essays
    - Super admins can view all reports
*/

-- Create plagiarism_reports table
CREATE TABLE IF NOT EXISTS plagiarism_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  similarity_percentage integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '[]',
  status text DEFAULT 'checking' CHECK (status IN ('checking', 'completed', 'failed')),
  checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_essay_id ON plagiarism_reports(essay_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_status ON plagiarism_reports(status);
CREATE INDEX IF NOT EXISTS idx_plagiarism_reports_similarity ON plagiarism_reports(similarity_percentage);

-- Enable Row Level Security
ALTER TABLE plagiarism_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can view plagiarism reports for their own essays"
  ON plagiarism_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e 
      WHERE e.id = essay_id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view plagiarism reports for their students' essays"
  ON plagiarism_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.id = essay_id AND u.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create plagiarism reports for their students' essays"
  ON plagiarism_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essays e 
      JOIN users u ON e.student_id = u.id 
      WHERE e.id = essay_id AND u.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all plagiarism reports"
  ON plagiarism_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_plagiarism_reports_updated_at
  BEFORE UPDATE ON plagiarism_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();