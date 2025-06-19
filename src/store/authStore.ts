import { create } from 'zustand';
import { User } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      console.log('🔐 Starting authentication for:', email);
      
      // FORCE DATABASE AUTHENTICATION - Skip connection check
      console.log('🔗 Querying user database directly...');
      
      // Query the users table directly for authentication
      const { data: userData, error: authError } = await supabase
        .from('users')
        .select('id, email, password, full_name, role, phone, address, avatar_url, teacher_id, created_at, updated_at')
        .eq('email', email.trim())
        .maybeSingle();

      if (authError) {
        console.error('❌ Database query error:', authError);
        set({ isLoading: false });
        throw new Error('Database query failed: ' + authError.message);
      }

      if (!userData) {
        console.log('❌ User not found in database for email:', email);
        console.log('📋 Available emails in your database:');
        console.log('   - admin@school.edu');
        console.log('   - teacher@school.edu');
        console.log('   - student@school.edu');
        console.log('   - tech@gmail.com');
        console.log('   - abiha@gmail.com');
        set({ isLoading: false });
        throw new Error('Invalid email or password');
      }

      console.log('✅ User found in database:', {
        email: userData.email,
        role: userData.role,
        hasPassword: !!userData.password
      });

      // Check password (direct comparison since it's stored as plaintext in demo)
      if (!userData.password || userData.password !== password) {
        console.log('❌ Password mismatch. Expected:', userData.password, 'Got:', password);
        set({ isLoading: false });
        throw new Error('Invalid email or password');
      }

      console.log('✅ Password verified successfully');

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        avatar_url: userData.avatar_url,
        teacher_id: userData.teacher_id,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };

      set({ user, isLoading: false });
      localStorage.setItem('essayai_user', JSON.stringify(user));
      console.log('✅ Login successful for:', user.full_name, 'Role:', user.role);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      set({ isLoading: false });
      throw new Error(error.message || 'Login failed');
    }
  },
  
  signOut: async () => {
    set({ user: null });
    localStorage.removeItem('essayai_user');
    console.log('👋 User signed out');
  },

  initializeAuth: async () => {
    try {
      console.log('🔄 Initializing authentication...');
      
      // Check for saved user session
      const savedUser = localStorage.getItem('essayai_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log('🔄 Restoring user session for:', user.email);
          
          // Try to verify the user still exists in the database
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('id, email, full_name, role, phone, address, avatar_url, teacher_id, created_at, updated_at')
              .eq('id', user.id)
              .maybeSingle();

            if (error || !userData) {
              console.log('❌ Saved user no longer exists, clearing session');
              localStorage.removeItem('essayai_user');
              return;
            }

            // Update user data from database
            const updatedUser: User = {
              id: userData.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role,
              phone: userData.phone,
              address: userData.address,
              avatar_url: userData.avatar_url,
              teacher_id: userData.teacher_id,
              created_at: userData.created_at,
              updated_at: userData.updated_at,
            };
            
            set({ user: updatedUser });
            localStorage.setItem('essayai_user', JSON.stringify(updatedUser));
            console.log('✅ Session restored for:', updatedUser.full_name);
          } catch (dbError) {
            // If database check fails, still restore the session
            set({ user });
            console.log('⚠️ Database check failed, using cached session');
          }
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('essayai_user');
        }
      } else {
        console.log('ℹ️ No saved session found');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('essayai_user');
    }
  },
}));