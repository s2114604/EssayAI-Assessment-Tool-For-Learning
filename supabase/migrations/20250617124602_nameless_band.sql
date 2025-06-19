/*
  # Insert demo users for EssayAI platform

  1. Demo Users
    - System Administrator (admin@school.edu / password123)
    - Teacher (teacher@school.edu / demo123)  
    - Student (student@school.edu / demo123)
    - Additional Teacher (teacher2@school.edu / demo123)
    - Additional Students (student2@school.edu, student3@school.edu / demo123)

  2. Notes
    - Uses ON CONFLICT DO NOTHING to prevent duplicate insertions
    - Passwords are stored as plaintext for demo purposes
    - In production, passwords should be properly hashed
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