import { create } from 'zustand';
import { Assignment } from '../types';
import { supabase, handleSupabaseError, isSupabaseConnected } from '../lib/supabase';

interface AssignmentState {
  assignments: Assignment[];
  isLoading: boolean;
  createAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  loadAssignments: () => Promise<void>;
  loadTeacherAssignments: (teacherId: string) => Promise<void>;
  loadStudentAssignments: (studentId: string) => Promise<void>;
  getAssignmentById: (id: string) => Assignment | undefined;
  getActiveAssignments: () => Assignment[];
  getAssignmentsByTeacher: (teacherId: string) => Assignment[];
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,

  createAssignment: async (assignmentData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      set(state => ({
        assignments: [newAssignment, ...state.assignments],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  updateAssignment: async (id, assignmentData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { data: updatedAssignment, error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      set(state => ({
        assignments: state.assignments.map(assignment =>
          assignment.id === id ? updatedAssignment : assignment
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      set(state => ({
        assignments: state.assignments.filter(assignment => assignment.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  loadAssignments: async () => {
    set({ isLoading: true });
    
    try {
      console.log('📚 Loading ALL assignments for super admin...');
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty assignments list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ assignments: [], isLoading: false });
        return;
      }

      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teacher:users!assignments_teacher_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log(`✅ Loaded ${assignments?.length || 0} total assignments`);
      set({ assignments: assignments || [], isLoading: false });
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      set({ assignments: [], isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  loadTeacherAssignments: async (teacherId) => {
    set({ isLoading: true });
    
    try {
      console.log(`📚 Loading assignments for teacher ${teacherId}...`);
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty assignments list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ assignments: [], isLoading: false });
        return;
      }

      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teacher:users!assignments_teacher_id_fkey(id, full_name, email)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log(`✅ Loaded ${assignments?.length || 0} assignments for teacher ${teacherId}`);
      set({ assignments: assignments || [], isLoading: false });
    } catch (error: any) {
      console.error('Error loading teacher assignments:', error);
      set({ assignments: [], isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  loadStudentAssignments: async (studentId) => {
    set({ isLoading: true });
    
    try {
      console.log(`🎓 Loading assignments for student ${studentId}...`);
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty assignments list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ assignments: [], isLoading: false });
        return;
      }

      // First get the student's teacher_id
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('teacher_id')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw new Error('Failed to get student information');
      }

      if (!student?.teacher_id) {
        console.log('Student is not assigned to any teacher');
        set({ assignments: [], isLoading: false });
        return;
      }

      // Get assignments from the student's assigned teacher
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          teacher:users!assignments_teacher_id_fkey(id, full_name, email)
        `)
        .eq('teacher_id', student.teacher_id)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`✅ Loaded ${assignments?.length || 0} assignments for student ${studentId}`);
      set({ assignments: assignments || [], isLoading: false });
    } catch (error: any) {
      console.error('Error loading student assignments:', error);
      set({ assignments: [], isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  getAssignmentById: (id) => {
    return get().assignments.find(assignment => assignment.id === id);
  },

  getActiveAssignments: () => {
    return get().assignments.filter(assignment => assignment.is_active);
  },

  getAssignmentsByTeacher: (teacherId) => {
    return get().assignments.filter(assignment => assignment.teacher_id === teacherId);
  },
}));