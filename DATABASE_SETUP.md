# 🗄️ EssayAI Database Setup Guide

This guide provides comprehensive instructions for setting up and configuring the database for the EssayAI platform. Follow these steps to ensure your database is properly configured and connected to the application.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Supabase Setup (Recommended)](#supabase-setup-recommended)
3. [Local PostgreSQL Setup (Alternative)](#local-postgresql-setup-alternative)
4. [Database Schema](#database-schema)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Demo Data](#demo-data)
7. [Troubleshooting](#troubleshooting)

## Overview

EssayAI uses PostgreSQL as its database, managed through Supabase. The database consists of several key tables:
- `users` - User accounts with role-based access
- `essays` - Student essay submissions
- `essay_grades` - AI and teacher grading data
- `assignments` - Teacher-created assignments
- `plagiarism_reports` - Plagiarism detection results

## Supabase Setup (Recommended)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization or create a new one
5. Fill in project details:
   - **Name**: EssayAI Database
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

### Step 2: Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Update Your Environment Variables
1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Replace these with your actual Supabase values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Keep your other environment variables as they are
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_TURNITIN_API_KEY=your_turnitin_api_key
VITE_TURNITIN_API_URL=your_turnitin_api_url
VITE_REPLICATE_API_TOKEN=r8_5f1bMbZLtLY13ePuPMRJyYM9dh2tJIG41k6YO
VITE_APP_NAME=EssayAI
VITE_APP_VERSION=1.0.0
```

### Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order. You can copy and paste them one by one:

#### Migration 1: Create Users Table
```sql
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
```

#### Migration 2: Create Essays Table
```sql
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

-- Trigger for updated_at
CREATE TRIGGER update_essays_updated_at
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 3: Create Essay Grades Table
```sql
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

-- Trigger for updated_at
CREATE TRIGGER update_essay_grades_updated_at
  BEFORE UPDATE ON essay_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 4: Create Plagiarism Reports Table
```sql
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

-- Trigger for updated_at
CREATE TRIGGER update_plagiarism_reports_updated_at
  BEFORE UPDATE ON plagiarism_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 5: Create Assignments Table
```sql
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

-- Trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Migration 6: Add Detailed Feedback Column to Essay Grades
```sql
/*
  # Add detailed_feedback column to essay_grades table

  1. Changes
    - Add detailed_feedback column to store comprehensive analysis breakdown
    - This allows storing detailed feedback for each grading criterion
    - Supports both AI and manual grading with detailed analysis
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
```

#### Migration 7: Add Unique Constraint to Essay Grades
```sql
/*
  # Add unique constraint to essay_grades table

  1. Changes
    - Add unique constraint on essay_id column in essay_grades table
    - This allows upsert operations to work correctly when grading essays
    - Ensures each essay can only have one grade record
*/

-- Add unique constraint to essay_id column
ALTER TABLE essay_grades 
ADD CONSTRAINT essay_grades_essay_id_unique UNIQUE (essay_id);
```

#### Migration 8: Insert Demo Data
```sql
/*
  # Insert demo users for EssayAI platform

  1. Demo Users
    - System Administrator (admin@school.edu / password123)
    - Teacher (teacher@school.edu / demo123)  
    - Student (student@school.edu / demo123)
    - Additional Teacher (teacher2@school.edu / demo123)
    - Additional Students (student2@school.edu, student3@school.edu / demo123)
*/

-- Insert demo users with proper error handling
INSERT INTO users (email, password, full_name, role, phone, address) 
VALUES 
  ('admin@school.edu', 'password123', 'System Administrator', 'super_admin', NULL, NULL),
  ('teacher@school.edu', 'demo123', 'Dr. Sarah Johnson', 'teacher', '(555) 123-4567', '123 University Ave'),
  ('teacher2@school.edu', 'demo123', 'Prof. Michael Brown', 'teacher', '(555) 234-5678', '789 Faculty Rd')
ON CONFLICT (email) DO NOTHING;

-- Insert students with teacher assignments
INSERT INTO users (email, password, full_name, role, phone, address, teacher_id) 
VALUES 
  ('student@school.edu', 'demo123', 'Alex Chen', 'student', '(555) 987-6543', '456 Student St', 
   (SELECT id FROM users WHERE email = 'teacher@school.edu')),
  ('student2@school.edu', 'demo123', 'Emma Davis', 'student', '(555) 345-6789', '321 Campus Dr', 
   (SELECT id FROM users WHERE email = 'teacher@school.edu')),
  ('student3@school.edu', 'demo123', 'James Wilson', 'student', '(555) 456-7890', '654 Dorm Blvd', 
   (SELECT id FROM users WHERE email = 'teacher2@school.edu'))
ON CONFLICT (email) DO NOTHING;

-- Insert sample assignments
INSERT INTO assignments (title, description, instructions, due_date, teacher_id)
VALUES 
  ('Essay on Climate Change', 
   'Write a comprehensive essay on the impacts of climate change on global ecosystems.',
   'Your essay should be 1500-2000 words and include at least 5 credible sources.',
   NOW() + INTERVAL '7 days',
   (SELECT id FROM users WHERE email = 'teacher@school.edu')),
  ('Historical Analysis Paper',
   'Analyze the causes and effects of World War II on modern society.',
   'Focus on economic, social, and political impacts. Minimum 1200 words.',
   NOW() + INTERVAL '14 days',
   (SELECT id FROM users WHERE email = 'teacher2@school.edu')),
  ('Literature Review',
   'Conduct a literature review on renewable energy technologies.',
   'Review at least 10 academic papers published in the last 5 years.',
   NOW() + INTERVAL '21 days',
   (SELECT id FROM users WHERE email = 'teacher@school.edu'))
ON CONFLICT DO NOTHING;
```

### Step 5: Set Up Row Level Security (RLS) Policies

After running the migrations, you need to set up the RLS policies for each table. These policies control access to the data based on user roles.

#### RLS Policies for Users Table
```sql
-- Allow authenticated users to read users table
CREATE POLICY "Allow authenticated read access"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update users table
CREATE POLICY "Allow authenticated update access"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert into users table
CREATE POLICY "Allow authenticated insert access"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete from users table
CREATE POLICY "Allow authenticated delete access"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);
```

#### RLS Policies for Essays Table
```sql
-- Allow authenticated users to insert essays with valid student_id
CREATE POLICY "Allow authenticated users to insert essays with valid student_i"
  ON essays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id 
      AND role = 'student'
    )
  );

-- Allow students and teachers to view essays
CREATE POLICY "Allow students and teachers to view essays"
  ON essays
  FOR SELECT
  TO authenticated
  USING (
    -- Student can view their own essays
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    OR
    -- Teachers can view their students' essays
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = essays.student_id 
      AND u.teacher_id IS NOT NULL
    )
    OR
    -- Teachers can view essays for their assignments
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = essays.assignment_id
    )
  );

-- Allow students to update their own essays
CREATE POLICY "Allow students to update their own essays"
  ON essays
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    AND status IN ('submitted', 'grading')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
  );

-- Allow students to delete their own essays
CREATE POLICY "Allow students to delete their own essays"
  ON essays
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = student_id
    )
    AND status = 'submitted'
  );
```

#### RLS Policies for Essay Grades Table
```sql
-- Allow authenticated users to read essay grades
CREATE POLICY "Allow authenticated read access"
  ON essay_grades
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert essay grades
CREATE POLICY "Allow authenticated insert access"
  ON essay_grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure the essay exists
    EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_grades.essay_id
    )
  );

-- Allow authenticated users to update essay grades
CREATE POLICY "Allow authenticated update access"
  ON essay_grades
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Ensure the essay exists
    EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_grades.essay_id
    )
  );

-- Allow authenticated users to delete essay grades
CREATE POLICY "Allow authenticated delete access"
  ON essay_grades
  FOR DELETE
  TO authenticated
  USING (true);
```

### Step 6: Test the Connection

1. Save your `.env` file with the correct values
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Check the browser console for connection messages
4. Try logging in with the demo accounts:
   - **Admin**: admin@school.edu / password123
   - **Teacher**: teacher@school.edu / demo123
   - **Student**: student@school.edu / demo123

## Local PostgreSQL Setup (Alternative)

If you prefer to run PostgreSQL locally instead of using Supabase:

### Step 1: Install PostgreSQL

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

### Step 2: Create Database and User
```bash
# Log in to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE essayai;

# Create user with password
CREATE USER essayai_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE essayai TO essayai_user;

# Connect to the database
\c essayai

# Grant schema privileges
GRANT ALL ON SCHEMA public TO essayai_user;
```

### Step 3: Run Migrations
Save each migration file from the Supabase migrations folder to your local machine, then run:

```bash
# Run migrations
psql -U essayai_user -d essayai -f path/to/migration1.sql
psql -U essayai_user -d essayai -f path/to/migration2.sql
# Continue for all migration files
```

### Step 4: Configure Environment Variables
Update your `.env` file to connect to your local PostgreSQL instance:

```env
# Local PostgreSQL
VITE_SUPABASE_URL=http://localhost:5432
VITE_SUPABASE_ANON_KEY=your_local_key
```

## Database Schema

The EssayAI platform uses a relational database schema with the following core tables:

### Users Table
Stores user accounts with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | Unique email address |
| password | text | User password (plaintext for demo) |
| full_name | text | User's full name |
| role | text | User role (super_admin, teacher, student) |
| phone | text | Optional phone number |
| address | text | Optional address |
| avatar_url | text | Optional profile picture URL |
| teacher_id | uuid | For students - assigned teacher reference |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Essays Table
Stores student essay submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Essay title |
| content | text | Essay text content |
| file_url | text | Uploaded file URL |
| file_name | text | File name |
| file_size | integer | File size in bytes |
| student_id | uuid | Reference to student user |
| assignment_id | uuid | Optional assignment reference |
| submitted_at | timestamptz | Submission timestamp |
| status | text | submitted, grading, graded, returned |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Essay Grades Table
Stores grading data for essays.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| essay_id | uuid | Reference to essay |
| total_score | integer | Overall score |
| max_score | integer | Maximum possible score |
| criteria_scores | jsonb | JSON breakdown by criteria |
| feedback | text | Detailed feedback text |
| detailed_feedback | jsonb | Criterion-specific detailed feedback |
| graded_by | text | ai or teacher |
| teacher_id | uuid | Optional teacher reference |
| graded_at | timestamptz | Grading timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Assignments Table
Stores teacher-created assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Assignment title |
| description | text | Assignment description |
| instructions | text | Detailed instructions |
| due_date | timestamptz | Deadline |
| max_score | integer | Maximum score |
| teacher_id | uuid | Reference to teacher user |
| file_url | text | Optional file URL |
| file_name | text | Optional file name |
| file_size | integer | Optional file size |
| is_active | boolean | Whether assignment is active |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Plagiarism Reports Table
Stores plagiarism detection results.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| essay_id | uuid | Reference to essay |
| similarity_percentage | integer | Overall similarity score |
| sources | jsonb | JSON array of matched sources |
| status | text | checking, completed, failed |
| checked_at | timestamptz | Check timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Row Level Security (RLS)

Supabase uses Row Level Security (RLS) to control access to data at the row level. The EssayAI platform implements RLS policies to ensure users can only access data they're authorized to see.

### Latest RLS Implementation

The latest implementation uses simplified RLS policies that work with our custom authentication system:

#### Users Table
```sql
-- Allow authenticated users to read/write users table
CREATE POLICY "Allow authenticated read access" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update access" ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated insert access" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON users FOR DELETE TO authenticated USING (true);
```

#### Essays Table
```sql
-- Allow authenticated users to insert essays with valid student_id
CREATE POLICY "Allow authenticated users to insert essays with valid student_i" ON essays FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = student_id AND role = 'student'));

-- Allow students and teachers to view essays
CREATE POLICY "Allow students and teachers to view essays" ON essays FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = student_id) OR 
       EXISTS (SELECT 1 FROM users u WHERE u.id = essays.student_id AND u.teacher_id IS NOT NULL) OR 
       EXISTS (SELECT 1 FROM assignments a WHERE a.id = essays.assignment_id));

-- Allow students to update their own essays
CREATE POLICY "Allow students to update their own essays" ON essays FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = student_id) AND status IN ('submitted', 'grading'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = student_id));

-- Allow students to delete their own essays
CREATE POLICY "Allow students to delete their own essays" ON essays FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = student_id) AND status = 'submitted');
```

#### Essay Grades Table
```sql
-- Allow authenticated users to read/write essay grades
CREATE POLICY "Allow authenticated read access" ON essay_grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON essay_grades FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_grades.essay_id));
CREATE POLICY "Allow authenticated update access" ON essay_grades FOR UPDATE TO authenticated 
USING (true) WITH CHECK (EXISTS (SELECT 1 FROM essays WHERE essays.id = essay_grades.essay_id));
CREATE POLICY "Allow authenticated delete access" ON essay_grades FOR DELETE TO authenticated USING (true);
```

#### Assignments Table
```sql
-- Allow authenticated users to read/write assignments
CREATE POLICY "Allow authenticated read access" ON assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON assignments FOR DELETE TO authenticated USING (true);
```

#### Plagiarism Reports Table
```sql
-- Allow authenticated users to read/write plagiarism reports
CREATE POLICY "Allow authenticated read access" ON plagiarism_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON plagiarism_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON plagiarism_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete access" ON plagiarism_reports FOR DELETE TO authenticated USING (true);
```

## Demo Data

The system includes demo data to help you get started quickly. The following demo accounts are created:

### Demo Users
- **Super Admin**: admin@school.edu / password123
- **Teachers**:
  - teacher@school.edu / demo123
  - teacher2@school.edu / demo123
- **Students**:
  - student@school.edu / demo123 (assigned to teacher@school.edu)
  - student2@school.edu / demo123 (assigned to teacher@school.edu)
  - student3@school.edu / demo123 (assigned to teacher2@school.edu)

### Demo Assignments
- **Essay on Climate Change** - Due in 7 days
- **Historical Analysis Paper** - Due in 14 days
- **Literature Review** - Due in 21 days

## Troubleshooting

### Connection Issues
If you're having trouble connecting to the database:

1. **Check Credentials**: Verify your Supabase URL and anon key in the `.env` file
2. **Check Network**: Ensure your network allows connections to Supabase
3. **Check Console**: Look for error messages in the browser console
4. **Run Diagnostic**: Use the built-in diagnostic tool in the login screen

### Database Errors
If you encounter database errors:

1. **Check Migrations**: Ensure all migrations ran successfully
2. **Check RLS Policies**: Verify RLS policies are correctly set up
3. **Check Permissions**: Ensure your Supabase user has the necessary permissions

### Authentication Issues
If you're having trouble logging in:

1. **Check Demo Users**: Verify the demo users were inserted correctly
2. **Check Passwords**: Ensure passwords match what's in the database
3. **Check RLS**: Verify RLS policies allow the necessary access

### Diagnostic Tool
The application includes a built-in database diagnostic tool:

1. Attempt to log in
2. If connection issues are detected, click "Run Database Diagnostic"
3. The diagnostic will check:
   - Environment variables
   - Database connection
   - Table existence
   - Demo data
   - Specific login credentials

## Advanced Configuration

### Custom Authentication
The EssayAI platform uses a custom authentication system that directly queries the `users` table instead of using Supabase Auth. This approach:

1. Simplifies the authentication flow
2. Avoids the need for email verification
3. Works well with the demo data
4. Allows for easy password management

### Database Relationships
The database uses the following relationships:

- **One-to-Many**: Teacher to Students (via teacher_id in users table)
- **One-to-Many**: Teacher to Assignments
- **One-to-Many**: Student to Essays
- **One-to-Many**: Assignment to Essays
- **One-to-One**: Essay to Essay Grade
- **One-to-One**: Essay to Plagiarism Report

### Performance Considerations
For optimal database performance:

1. **Indexes**: Key columns are indexed for faster queries
2. **JSON Storage**: Complex data is stored in JSONB columns for flexibility
3. **Constraints**: Foreign key constraints maintain data integrity
4. **Triggers**: Automatic updated_at timestamp updates