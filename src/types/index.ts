export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'teacher' | 'student';
  avatar_url?: string;
  phone?: string;
  address?: string;
  teacher_id?: string; // For students - which teacher they're assigned to
  created_at: string;
  updated_at: string;
}

export interface Essay {
  id: string;
  title: string;
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  student_id: string;
  assignment_id?: string;
  submitted_at: string;
  status: 'submitted' | 'grading' | 'graded' | 'returned';
  grade?: EssayGrade;
  plagiarism_report?: PlagiarismReport;
  ai_detection_report?: AIDetectionReport;
  assignment?: Assignment; // Include assignment details when populated
}

export interface EssayGrade {
  id: string;
  essay_id: string;
  total_score: number;
  max_score: number;
  criteria_scores: {
    grammar: number;
    cohesion: number;
    sentence_structure: number;
    tone: number;
    organization: number;
  };
  feedback: string;
  detailed_feedback?: {
    grammar: string;
    cohesion: string;
    sentence_structure: string;
    tone: string;
    organization: string;
  };
  graded_by: 'ai' | 'teacher';
  graded_at: string;
  teacher_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlagiarismReport {
  id: string;
  essay_id: string;
  similarity_percentage: number;
  sources: PlagiarismSource[];
  status: 'checking' | 'completed' | 'failed';
  checked_at: string;
}

export interface PlagiarismSource {
  id: string;
  url: string;
  title: string;
  similarity_percentage: number;
  matched_text: string;
}

export interface AIDetectionReport {
  id: string;
  essay_id: string;
  ai_probability: number;
  human_probability: number;
  confidence: number;
  analysis: string;
  status: 'checking' | 'completed' | 'failed';
  checked_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  due_date: string;
  max_score: number;
  teacher_id: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher?: User; // Include teacher details when populated
  submission_count?: number; // Number of submissions for this assignment
  submissions?: Essay[]; // Student submissions for this assignment
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  students: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// New interface for teacher-student relationships
export interface TeacherStudentAssignment {
  id: string;
  teacher_id: string;
  student_id: string;
  assigned_at: string;
  assigned_by: string; // Admin who made the assignment
}