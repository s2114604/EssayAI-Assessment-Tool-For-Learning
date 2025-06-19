/*
  # Fix User Profile Access Policy

  This migration adds a policy to allow authenticated users to read their own profile data
  using the correct UUID type casting for auth.uid().

  ## Changes
  1. Add RLS policy for authenticated users to read their own profile
  2. Use proper UUID type casting to match auth.uid() with user id
*/

-- Add policy for authenticated users to read their own profile data using auth.uid()
CREATE POLICY "Users can read own profile via auth"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);