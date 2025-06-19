/*
  # Add unique constraint to essay_grades table

  1. Changes
    - Add unique constraint on essay_id column in essay_grades table
    - This allows upsert operations to work correctly when grading essays
    - Ensures each essay can only have one grade record

  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity by preventing duplicate grades per essay
*/

-- Add unique constraint to essay_id column
ALTER TABLE essay_grades 
ADD CONSTRAINT essay_grades_essay_id_unique UNIQUE (essay_id);