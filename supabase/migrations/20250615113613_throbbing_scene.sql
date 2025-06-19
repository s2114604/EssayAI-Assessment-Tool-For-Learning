/*
  # Add Default Admin User

  1. New Data
    - Insert default super admin user for initial system access
    - Email: admin@school.edu
    - Password: password123 (plain text for demo purposes)
    - Role: super_admin
    - Full name: System Administrator

  2. Purpose
    - Provides initial admin access to the system
    - Allows super admin to create other users
    - Enables system bootstrapping

  Note: In production, passwords should be properly hashed and secured.
  This is a simplified authentication system for demonstration purposes.
*/

-- Insert default admin user if it doesn't already exist
INSERT INTO users (
  email,
  password,
  full_name,
  role
) 
SELECT 
  'admin@school.edu',
  'password123',
  'System Administrator',
  'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@school.edu'
);