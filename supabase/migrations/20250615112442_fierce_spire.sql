/*
  # Create users table for EssayAI platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `password` (text, not null) - In production, this should be hashed
      - `full_name` (text, not null)
      - `role` (text, not null) - super_admin, teacher, or student
      - `phone` (text, optional)
      - `address` (text, optional)
      - `avatar_url` (text, optional)
      - `teacher_id` (uuid, optional) - For students, references which teacher they're assigned to
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to manage user data based on roles
    - Super admins can manage all users
    - Teachers can view their assigned students
    - Students can only view their own data

  3. Indexes
    - Index on email for fast lookups
    - Index on role for filtering
    - Index on teacher_id for student-teacher relationships
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'teacher', 'student')),
  phone text,
  address text,
  avatar_url text,
  teacher_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for user access control
CREATE POLICY "Super admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

CREATE POLICY "Teachers can view their assigned students"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'student' AND teacher_id = auth.uid()
    OR id = auth.uid()
  );

CREATE POLICY "Students can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user (password should be hashed in production)
INSERT INTO users (email, password, full_name, role) 
VALUES ('admin@school.edu', 'password123', 'System Administrator', 'super_admin')
ON CONFLICT (email) DO NOTHING;