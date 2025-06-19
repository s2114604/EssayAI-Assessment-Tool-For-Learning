/*
  # Add detailed_feedback column to essay_grades table

  1. Changes
    - Add detailed_feedback column to store comprehensive analysis breakdown
    - This allows storing detailed feedback for each grading criterion
    - Supports both AI and manual grading with detailed analysis

  2. Column Details
    - detailed_feedback (jsonb) - Stores detailed feedback for each criterion
    - Default empty object for existing records
    - Allows comprehensive analysis storage and retrieval
*/

-- Add detailed_feedback column to essay_grades table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'essay_grades' AND column_name = 'detailed_feedback'
  ) THEN
    ALTER TABLE essay_grades 
    ADD COLUMN detailed_feedback jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create index for better performance on detailed_feedback queries
CREATE INDEX IF NOT EXISTS idx_essay_grades_detailed_feedback ON essay_grades USING gin(detailed_feedback);