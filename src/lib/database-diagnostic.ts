// Database Diagnostic Tool for EssayAI Platform
import { supabase } from './supabase';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class DatabaseDiagnostic {
  private results: DiagnosticResult[] = [];

  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    console.log('🔍 === STARTING COMPREHENSIVE DATABASE DIAGNOSTIC ===');
    this.results = [];

    // Test 1: Environment Variables
    await this.testEnvironmentVariables();

    // Test 2: Basic Connection
    await this.testBasicConnection();

    // Test 3: Database Schema
    await this.testDatabaseSchema();

    // Test 4: User Data
    await this.testUserData();

    // Test 5: Demo Data
    await this.testDemoData();

    console.log('📊 === DIAGNOSTIC RESULTS ===');
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.message}`);
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });

    return this.results;
  }

  private async testEnvironmentVariables() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.results.push({
        test: 'Environment Variables',
        status: 'fail',
        message: 'Missing Supabase environment variables',
        details: {
          url: supabaseUrl ? 'Present' : 'Missing',
          key: supabaseKey ? 'Present' : 'Missing'
        }
      });
      return;
    }

    if (supabaseUrl.includes('demo') || supabaseKey.includes('demo')) {
      this.results.push({
        test: 'Environment Variables',
        status: 'fail',
        message: 'Using demo/placeholder values',
        details: { url: supabaseUrl, keyLength: supabaseKey.length }
      });
      return;
    }

    this.results.push({
      test: 'Environment Variables',
      status: 'pass',
      message: 'Environment variables configured',
      details: { 
        url: supabaseUrl.substring(0, 30) + '...', 
        keyLength: supabaseKey.length 
      }
    });
  }

  private async testBasicConnection() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.results.push({
          test: 'Basic Connection',
          status: 'fail',
          message: 'Database connection failed',
          details: error
        });
        return;
      }

      this.results.push({
        test: 'Basic Connection',
        status: 'pass',
        message: 'Successfully connected to database'
      });
    } catch (error) {
      this.results.push({
        test: 'Basic Connection',
        status: 'fail',
        message: 'Connection error',
        details: error
      });
    }
  }

  private async testDatabaseSchema() {
    const tables = ['users', 'essays', 'essay_grades', 'assignments', 'plagiarism_reports'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          this.results.push({
            test: `Schema - ${table}`,
            status: 'fail',
            message: `Table ${table} not accessible`,
            details: error
          });
        } else {
          this.results.push({
            test: `Schema - ${table}`,
            status: 'pass',
            message: `Table ${table} exists and accessible`
          });
        }
      } catch (error) {
        this.results.push({
          test: `Schema - ${table}`,
          status: 'fail',
          message: `Error accessing ${table}`,
          details: error
        });
      }
    }
  }

  private async testUserData() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .limit(10);

      if (error) {
        this.results.push({
          test: 'User Data',
          status: 'fail',
          message: 'Cannot fetch user data',
          details: error
        });
        return;
      }

      const userCount = users?.length || 0;
      const adminCount = users?.filter(u => u.role === 'super_admin').length || 0;
      const teacherCount = users?.filter(u => u.role === 'teacher').length || 0;
      const studentCount = users?.filter(u => u.role === 'student').length || 0;

      this.results.push({
        test: 'User Data',
        status: userCount > 0 ? 'pass' : 'warning',
        message: `Found ${userCount} users`,
        details: {
          total: userCount,
          admins: adminCount,
          teachers: teacherCount,
          students: studentCount,
          sampleEmails: users?.slice(0, 3).map(u => u.email) || []
        }
      });

    } catch (error) {
      this.results.push({
        test: 'User Data',
        status: 'fail',
        message: 'Error fetching user data',
        details: error
      });
    }
  }

  private async testDemoData() {
    try {
      // Check if demo users exist with correct credentials
      const demoCredentials = [
        { email: 'admin@school.edu', role: 'super_admin' },
        { email: 'teacher@school.edu', role: 'teacher' },
        { email: 'student@school.edu', role: 'student' }
      ];

      const results = [];
      
      for (const cred of demoCredentials) {
        const { data: user, error } = await supabase
          .from('users')
          .select('email, role, id')
          .eq('email', cred.email)
          .maybeSingle();

        if (error) {
          results.push({ email: cred.email, status: 'error', details: error });
        } else if (!user) {
          results.push({ email: cred.email, status: 'missing' });
        } else if (user.role !== cred.role) {
          results.push({ email: cred.email, status: 'wrong_role', expected: cred.role, actual: user.role });
        } else {
          results.push({ email: cred.email, status: 'ok', id: user.id });
        }
      }

      const okCount = results.filter(r => r.status === 'ok').length;
      
      this.results.push({
        test: 'Demo Data',
        status: okCount === demoCredentials.length ? 'pass' : 'warning',
        message: `${okCount}/${demoCredentials.length} demo users configured correctly`,
        details: results
      });

    } catch (error) {
      this.results.push({
        test: 'Demo Data',
        status: 'fail',
        message: 'Error checking demo data',
        details: error
      });
    }
  }

  async testSpecificLogin(email: string, password: string): Promise<DiagnosticResult> {
    console.log(`🔐 Testing login for: ${email}`);
    
    try {
      // Check if user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, full_name, password')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        return {
          test: 'Specific Login Test',
          status: 'fail',
          message: 'Database query failed',
          details: userError
        };
      }

      if (!userData) {
        return {
          test: 'Specific Login Test',
          status: 'fail',
          message: 'User not found in database',
          details: { email, searched: true }
        };
      }

      console.log('User found in database:', userData);

      // Test password match
      if (userData.password !== password) {
        return {
          test: 'Specific Login Test',
          status: 'fail',
          message: 'Password does not match',
          details: { 
            userInDb: true,
            userRole: userData.role,
            passwordProvided: !!password,
            passwordInDb: !!userData.password
          }
        };
      }

      return {
        test: 'Specific Login Test',
        status: 'pass',
        message: 'Login credentials are valid',
        details: {
          userId: userData.id,
          email: userData.email,
          role: userData.role,
          fullName: userData.full_name
        }
      };

    } catch (error) {
      return {
        test: 'Specific Login Test',
        status: 'fail',
        message: 'Unexpected error during login test',
        details: error
      };
    }
  }
}

export const diagnostic = new DatabaseDiagnostic();