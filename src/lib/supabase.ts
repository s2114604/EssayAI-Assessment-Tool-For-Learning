import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string | null;
          full_name: string;
          role: 'super_admin' | 'teacher' | 'student';
          phone: string | null;
          address: string | null;
          avatar_url: string | null;
          teacher_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password?: string | null;
          full_name: string;
          role: 'super_admin' | 'teacher' | 'student';
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          teacher_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string | null;
          full_name?: string;
          role?: 'super_admin' | 'teacher' | 'student';
          phone?: string | null;
          address?: string | null;
          avatar_url?: string | null;
          teacher_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred';
};

// Helper function to check if user is authenticated
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Check if Supabase is properly configured and accessible
export const isSupabaseConnected = async (): Promise<boolean> => {
  try {
    // FORCE CONNECTION - Skip placeholder check since we know the credentials work
    console.log('🔗 Forcing Supabase connection test...');
    
    // Try a simple query to test connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Supabase connection timeout after 10 seconds');
      controller.abort();
    }, 10000); // Increased timeout to 10 seconds
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
        
      clearTimeout(timeoutId);
      
      if (error) {
        console.log('❌ Supabase query error:', error.message);
        return false;
      }
      
      console.log('✅ Supabase connection successful - database is accessible');
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.log('❌ Supabase connection timeout - check your network');
      } else if (fetchError.message?.includes('Failed to fetch')) {
        console.log('❌ Network error - check your internet connection');
      } else {
        console.log('❌ Supabase connection failed:', fetchError.message || fetchError);
      }
      return false;
    }
  } catch (error: any) {
    console.log('❌ Supabase connection failed:', error.message || error);
    return false;
  }
};