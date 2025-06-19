import { create } from 'zustand';
import { User } from '../types';
import { supabase, handleSupabaseError, isSupabaseConnected } from '../lib/supabase';

interface UserState {
  users: User[];
  isLoading: boolean;
  addUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }) => Promise<void>;
  updateUser: (id: string, userData: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: User['role']) => User[];
  getStudentsByTeacher: (teacherId: string) => User[];
  assignStudentToTeacher: (studentId: string, teacherId: string) => Promise<void>;
  unassignStudentFromTeacher: (studentId: string) => Promise<void>;
  loadUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,

  loadUsers: async () => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your Supabase configuration.');
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, address, teacher_id, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedUsers: User[] = (users || []).map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar_url: user.avatar_url,
        teacher_id: user.teacher_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));

      set({ users: formattedUsers, isLoading: false });
    } catch (error: any) {
      console.error('Error loading users:', error);
      set({ users: [], isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  addUser: async (userData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your Supabase configuration.');
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email);

      if (checkError) {
        throw checkError;
      }

      if (existingUser && existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone || null,
          address: userData.address || null,
          avatar_url: userData.avatar_url || null,
          teacher_id: userData.teacher_id || null,
        }])
        .select('id, email, full_name, role, phone, address, teacher_id, avatar_url, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      const formattedUser: User = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        phone: newUser.phone,
        address: newUser.address,
        avatar_url: newUser.avatar_url,
        teacher_id: newUser.teacher_id,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      };

      set(state => ({
        users: [formattedUser, ...state.users],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your Supabase configuration.');
      }

      // Prepare update data, removing undefined values
      const updateData: any = {};
      
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.address !== undefined) updateData.address = userData.address;
      if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url;
      if (userData.teacher_id !== undefined) updateData.teacher_id = userData.teacher_id;
      if (userData.password !== undefined && userData.password.trim()) {
        updateData.password = userData.password;
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, email, full_name, role, phone, address, teacher_id, avatar_url, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      const formattedUser: User = {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar_url: updatedUser.avatar_url,
        teacher_id: updatedUser.teacher_id,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      };

      set(state => ({
        users: state.users.map(user =>
          user.id === id ? formattedUser : user
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your Supabase configuration.');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      set(state => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  getUserById: (id) => {
    return get().users.find(user => user.id === id);
  },

  getUsersByRole: (role) => {
    return get().users.filter(user => user.role === role);
  },

  getStudentsByTeacher: (teacherId) => {
    return get().users.filter(user => user.role === 'student' && user.teacher_id === teacherId);
  },

  assignStudentToTeacher: async (studentId, teacherId) => {
    await get().updateUser(studentId, { teacher_id: teacherId });
  },

  unassignStudentFromTeacher: async (studentId) => {
    await get().updateUser(studentId, { teacher_id: null });
  },
}));