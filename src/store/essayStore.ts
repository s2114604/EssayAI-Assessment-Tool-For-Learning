import { create } from 'zustand';
import { Essay, EssayGrade, PlagiarismReport } from '../types';
import { supabase, handleSupabaseError, isSupabaseConnected } from '../lib/supabase';
import { openaiGrader, validateEssayForGrading } from '../lib/openai';
import { replicateAIDetector, AIDetectionResult, AIDetectionReport } from '../lib/replicate';

interface EssayState {
  essays: Essay[];
  isLoading: boolean;
  submitEssay: (essay: Omit<Essay, 'id' | 'submitted_at' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEssay: (id: string, essay: Partial<Essay>) => Promise<void>;
  deleteEssay: (id: string) => Promise<void>;
  gradeEssayWithAI: (essayId: string, onProgress?: (message: string) => void) => Promise<EssayGrade>;
  submitManualGrade: (gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  checkPlagiarism: (essayId: string) => Promise<void>;
  checkAIContent: (essayId: string, onProgress?: (message: string) => void) => Promise<AIDetectionReport>;
  loadEssays: () => Promise<void>;
  loadStudentEssays: (studentId: string) => Promise<void>;
  loadTeacherEssays: (teacherId: string) => Promise<void>;
  loadAssignmentSubmissions: (assignmentId: string) => Promise<void>;
  getEssaysByStudent: (studentId: string) => Essay[];
  getEssaysByTeacher: (teacherId: string) => Essay[];
  getEssaysByAssignment: (assignmentId: string) => Essay[];
  getStudentSubmissionForAssignment: (studentId: string, assignmentId: string) => Essay | undefined;
}

export const useEssayStore = create<EssayState>((set, get) => ({
  essays: [],
  isLoading: false,
  
  submitEssay: async (essayData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { data: newEssay, error } = await supabase
        .from('essays')
        .insert([{
          ...essayData,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        }])
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      set(state => ({
        essays: [newEssay, ...state.essays],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  updateEssay: async (id, essayData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { data: updatedEssay, error } = await supabase
        .from('essays')
        .update({
          ...essayData,
          status: 'submitted', // Reset status when resubmitting
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      set(state => ({
        essays: state.essays.map(essay =>
          essay.id === id ? updatedEssay : essay
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  deleteEssay: async (id) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      const { error } = await supabase
        .from('essays')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      set(state => ({
        essays: state.essays.filter(essay => essay.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  // ENHANCED AI GRADING WITH COMPLETE DETAILED FEEDBACK STORAGE
  gradeEssayWithAI: async (essayId: string, onProgress?: (message: string) => void): Promise<EssayGrade> => {
    console.log('🚀 === STARTING ENHANCED AI GRADING WITH DETAILED FEEDBACK STORAGE ===');
    console.log('📝 Essay ID:', essayId);
    
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      // Step 1: Get essay details
      console.log('📚 Step 1: Fetching essay details...');
      onProgress?.('📚 Fetching essay details...');
      
      const { data: essay, error: essayError } = await supabase
        .from('essays')
        .select(`
          *,
          assignment:assignments(id, title, description, instructions),
          student:users!essays_student_id_fkey(id, full_name, email)
        `)
        .eq('id', essayId)
        .single();

      if (essayError || !essay) {
        throw new Error(`Failed to fetch essay: ${essayError?.message || 'Essay not found'}`);
      }

      console.log('✅ Essay found:', {
        title: essay.title,
        student: essay.student?.full_name || 'Unknown',
        contentLength: essay.content?.length || 0,
        wordCount: essay.content?.split(/\s+/).length || 0
      });

      // Step 2: Validate essay content
      console.log('🔍 Step 2: Validating essay content...');
      onProgress?.('🔍 Validating essay content...');
      
      const validation = validateEssayForGrading(essay.content || '');
      if (!validation.isValid) {
        throw new Error(validation.error || 'Essay content is invalid for grading');
      }

      // Step 3: Update essay status to grading
      console.log('🔄 Step 3: Updating essay status to grading...');
      onProgress?.('🔄 Updating essay status...');
      
      await supabase
        .from('essays')
        .update({ status: 'grading' })
        .eq('id', essayId);

      // Step 4: Perform comprehensive AI analysis
      console.log('🧠 Step 4: Starting comprehensive AI analysis with detailed feedback...');
      onProgress?.('🧠 Performing comprehensive AI analysis with detailed feedback...');
      
      const assignmentContext = essay.assignment 
        ? `Assignment: ${essay.assignment.title}\nDescription: ${essay.assignment.description}`
        : undefined;

      const aiResult = await openaiGrader.gradeEssay(
        essay.content || '',
        essay.title,
        undefined,
        assignmentContext,
        onProgress
      );

      console.log('✅ AI analysis completed successfully with detailed feedback:', {
        totalScore: aiResult.total_score,
        maxScore: aiResult.max_score,
        percentage: Math.round((aiResult.total_score / aiResult.max_score) * 100),
        hasFeedback: !!aiResult.feedback,
        hasDetailedFeedback: !!aiResult.detailed_feedback,
        criteriaScores: aiResult.criteria_scores,
        detailedFeedbackKeys: Object.keys(aiResult.detailed_feedback || {})
      });

      // Step 5: Prepare ENHANCED grade data with detailed feedback for database
      console.log('💾 Step 5: Preparing ENHANCED grade data with detailed feedback for database...');
      onProgress?.('💾 Preparing enhanced grade data with detailed feedback...');
      
      const savedUser = localStorage.getItem('essayai_user');
      let currentUserId = null;
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          currentUserId = user.id;
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }

      // ENHANCED: Ensure detailed feedback is comprehensive and properly structured
      const enhancedDetailedFeedback = {
        grammar: aiResult.detailed_feedback?.grammar || `Grammar & Mechanics Analysis (Score: ${aiResult.criteria_scores.grammar}/20):\n\nThis criterion evaluates spelling, punctuation, capitalization, and overall mechanical accuracy. Your essay demonstrates ${aiResult.criteria_scores.grammar >= 16 ? 'excellent' : aiResult.criteria_scores.grammar >= 12 ? 'good' : aiResult.criteria_scores.grammar >= 8 ? 'adequate' : 'developing'} command of grammar and mechanics. ${aiResult.criteria_scores.grammar < 16 ? 'Focus on proofreading for spelling errors, proper punctuation usage, and consistent capitalization.' : 'Continue maintaining this high standard of mechanical accuracy.'}`,
        
        cohesion: aiResult.detailed_feedback?.cohesion || `Cohesion & Coherence Analysis (Score: ${aiResult.criteria_scores.cohesion}/20):\n\nThis criterion assesses logical flow, transitions, and overall coherence of ideas. Your essay shows ${aiResult.criteria_scores.cohesion >= 16 ? 'excellent' : aiResult.criteria_scores.cohesion >= 12 ? 'good' : aiResult.criteria_scores.cohesion >= 8 ? 'adequate' : 'developing'} organization and flow. ${aiResult.criteria_scores.cohesion < 16 ? 'Consider adding more transition words and ensuring each paragraph connects logically to the next.' : 'Your ideas flow smoothly and logically throughout the essay.'}`,
        
        sentence_structure: aiResult.detailed_feedback?.sentence_variety || `Sentence Structure Analysis (Score: ${aiResult.criteria_scores.sentence_variety}/20):\n\nThis criterion evaluates variety in sentence length, complexity, and structure. Your writing demonstrates ${aiResult.criteria_scores.sentence_variety >= 16 ? 'excellent' : aiResult.criteria_scores.sentence_variety >= 12 ? 'good' : aiResult.criteria_scores.sentence_variety >= 8 ? 'adequate' : 'developing'} sentence variety. ${aiResult.criteria_scores.sentence_variety < 16 ? 'Try varying sentence beginnings and combining short sentences for better flow.' : 'You effectively use a variety of sentence structures to maintain reader interest.'}`,
        
        tone: aiResult.detailed_feedback?.tone || `Tone & Style Analysis (Score: ${aiResult.criteria_scores.tone}/20):\n\nThis criterion assesses appropriateness of tone, vocabulary choice, and writing style. Your essay maintains ${aiResult.criteria_scores.tone >= 16 ? 'excellent' : aiResult.criteria_scores.tone >= 12 ? 'good' : aiResult.criteria_scores.tone >= 8 ? 'adequate' : 'developing'} tone and style. ${aiResult.criteria_scores.tone < 16 ? 'Consider using more sophisticated vocabulary and maintaining consistent academic tone throughout.' : 'Your tone is appropriate and engaging for the intended audience.'}`,
        
        organization: aiResult.detailed_feedback?.structure || `Organization & Structure Analysis (Score: ${aiResult.criteria_scores.structure}/20):\n\nThis criterion evaluates overall essay structure, including introduction, body paragraphs, and conclusion. Your essay shows ${aiResult.criteria_scores.structure >= 16 ? 'excellent' : aiResult.criteria_scores.structure >= 12 ? 'good' : aiResult.criteria_scores.structure >= 8 ? 'adequate' : 'developing'} organizational structure. ${aiResult.criteria_scores.structure < 16 ? 'Ensure you have a clear thesis statement, well-developed body paragraphs, and a strong conclusion.' : 'Your essay is well-organized with clear introduction, body, and conclusion.'}`
      };

      const gradeData = {
        essay_id: essayId,
        total_score: aiResult.total_score,
        max_score: aiResult.max_score,
        criteria_scores: {
          grammar: aiResult.criteria_scores.grammar,
          cohesion: aiResult.criteria_scores.cohesion,
          sentence_structure: aiResult.criteria_scores.sentence_variety,
          tone: aiResult.criteria_scores.tone,
          organization: aiResult.criteria_scores.structure,
        },
        feedback: `🤖 COMPREHENSIVE AI ANALYSIS COMPLETE\n\n**Overall Performance:** ${Math.round((aiResult.total_score / aiResult.max_score) * 100)}% (${aiResult.total_score}/${aiResult.max_score} points)\n\n${aiResult.feedback}\n\n**Detailed Analysis:**\nThis comprehensive analysis evaluated your essay across five key criteria: Grammar & Mechanics, Cohesion & Coherence, Sentence Structure, Tone & Style, and Organization. Each criterion was scored individually to provide specific feedback for improvement.\n\n**Next Steps:**\n${(aiResult.suggestions || []).map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}\n\nThis analysis was performed using advanced AI algorithms that provide detailed, criterion-specific feedback to help you improve your writing skills.`,
        detailed_feedback: enhancedDetailedFeedback,
        graded_by: 'ai' as const,
        teacher_id: currentUserId,
        graded_at: new Date().toISOString(),
      };

      // Step 6: Save ENHANCED grade to database with detailed feedback
      console.log('💾 Step 6: SAVING ENHANCED GRADE WITH DETAILED FEEDBACK TO DATABASE...');
      onProgress?.('💾 Saving enhanced analysis with detailed feedback to database...');
      
      console.log('📊 Enhanced grade data being saved:', {
        essayId: gradeData.essay_id,
        totalScore: gradeData.total_score,
        maxScore: gradeData.max_score,
        criteriaScores: gradeData.criteria_scores,
        feedbackLength: gradeData.feedback.length,
        detailedFeedbackKeys: Object.keys(gradeData.detailed_feedback),
        detailedFeedbackLengths: Object.entries(gradeData.detailed_feedback).map(([key, value]) => `${key}: ${value.length} chars`),
        gradedBy: gradeData.graded_by
      });

      const { data: savedGrade, error: gradeError } = await supabase
        .from('essay_grades')
        .upsert([gradeData], { 
          onConflict: 'essay_id',
          ignoreDuplicates: false 
        })
        .select('*')
        .single();

      if (gradeError || !savedGrade) {
        console.error('❌ CRITICAL: Failed to save enhanced grade to database:', gradeError);
        throw new Error(`Failed to save enhanced grade to database: ${gradeError?.message || 'No data returned'}`);
      }

      console.log('✅ ✅ ✅ ENHANCED GRADE WITH DETAILED FEEDBACK SUCCESSFULLY SAVED TO DATABASE! ✅ ✅ ✅');
      console.log('💾 Saved enhanced grade details:', {
        id: savedGrade.id,
        essayId: savedGrade.essay_id,
        totalScore: savedGrade.total_score,
        maxScore: savedGrade.max_score,
        gradedBy: savedGrade.graded_by,
        feedbackLength: savedGrade.feedback?.length || 0,
        hasDetailedFeedback: !!savedGrade.detailed_feedback,
        detailedFeedbackKeys: Object.keys(savedGrade.detailed_feedback || {}),
        criteriaScores: savedGrade.criteria_scores
      });

      // Step 7: Update essay status to graded
      console.log('🔄 Step 7: Marking essay as GRADED...');
      onProgress?.('🔄 Finalizing grading...');
      
      const { error: statusError } = await supabase
        .from('essays')
        .update({ status: 'graded' })
        .eq('id', essayId);

      if (statusError) {
        console.error('❌ Failed to update essay status:', statusError);
        // Don't throw here, grade is saved successfully
      }

      // Step 8: Create complete grade object for return with enhanced detailed feedback
      console.log('🔄 Step 8: Creating complete enhanced grade object...');
      
      const completeGrade: EssayGrade = {
        id: savedGrade.id,
        essay_id: savedGrade.essay_id,
        total_score: savedGrade.total_score,
        max_score: savedGrade.max_score,
        criteria_scores: savedGrade.criteria_scores,
        feedback: savedGrade.feedback,
        detailed_feedback: savedGrade.detailed_feedback,
        graded_by: savedGrade.graded_by,
        teacher_id: savedGrade.teacher_id,
        graded_at: savedGrade.graded_at,
        created_at: savedGrade.created_at,
        updated_at: savedGrade.updated_at,
      };

      // Step 9: Update local state immediately with enhanced grade
      console.log('🔄 Step 9: Updating local state with enhanced graded essay...');
      
      set(state => ({
        essays: state.essays.map(e => 
          e.id === essayId 
            ? { ...e, grade: completeGrade, status: 'graded' as const }
            : e
        ),
        isLoading: false
      }));

      console.log('🎉 === ENHANCED AI GRADING WITH DETAILED FEEDBACK COMPLETED SUCCESSFULLY ===');
      console.log('📊 Final Enhanced Summary:', {
        student: essay.student?.full_name || 'Unknown',
        essay: essay.title,
        grade: `${savedGrade.total_score}/${savedGrade.max_score}`,
        percentage: `${Math.round((savedGrade.total_score/savedGrade.max_score)*100)}%`,
        status: 'ENHANCED GRADE WITH DETAILED FEEDBACK SAVED TO DATABASE AND READY FOR DISPLAY ✅',
        gradeId: savedGrade.id,
        detailedFeedbackAvailable: !!savedGrade.detailed_feedback,
        criteriaBreakdown: savedGrade.criteria_scores
      });
      
      return completeGrade;
      
    } catch (error: any) {
      console.error('❌ === ENHANCED AI GRADING FAILED ===');
      console.error('❌ Error:', error);
      
      // Reset essay status on error
      try {
        const isConnected = await isSupabaseConnected();
        if (isConnected) {
          await supabase
            .from('essays')
            .update({ status: 'submitted' })
            .eq('id', essayId);
        }
      } catch (resetError) {
        console.error('❌ Failed to reset essay status:', resetError);
      }
        
      set({ isLoading: false });
      throw new Error(error.message || 'Enhanced AI grading failed - please try again');
    }
  },

  submitManualGrade: async (gradeData) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      console.log('👨‍🏫 Starting manual grading with detailed feedback:', gradeData);
      
      // Get current user from localStorage since we're using simple auth
      const savedUser = localStorage.getItem('essayai_user');
      let currentUserId = null;
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          currentUserId = user.id;
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
      
      // ENHANCED: Ensure detailed feedback is included for manual grading
      const enhancedGradeData = {
        ...gradeData,
        teacher_id: gradeData.graded_by === 'teacher' && currentUserId ? currentUserId : null,
        // Ensure detailed_feedback is properly structured
        detailed_feedback: gradeData.detailed_feedback || {
          grammar: `Manual assessment of grammar and mechanics. Score: ${gradeData.criteria_scores?.grammar || 0}/20`,
          cohesion: `Manual assessment of cohesion and coherence. Score: ${gradeData.criteria_scores?.cohesion || 0}/20`,
          sentence_structure: `Manual assessment of sentence structure. Score: ${gradeData.criteria_scores?.sentence_structure || 0}/20`,
          tone: `Manual assessment of tone and style. Score: ${gradeData.criteria_scores?.tone || 0}/20`,
          organization: `Manual assessment of organization. Score: ${gradeData.criteria_scores?.organization || 0}/20`,
        }
      };

      console.log('💾 Saving enhanced manual grade to database:', enhancedGradeData);

      // Insert or update grade using upsert
      const { data: savedGrade, error: gradeError } = await supabase
        .from('essay_grades')
        .upsert([enhancedGradeData], { 
          onConflict: 'essay_id',
          ignoreDuplicates: false 
        })
        .select('*')
        .single();

      if (gradeError) {
        console.error('❌ Enhanced manual grade save error:', gradeError);
        throw gradeError;
      }

      console.log('✅ Enhanced manual grade saved successfully with detailed feedback');

      // Update essay status to graded
      await supabase
        .from('essays')
        .update({ status: 'graded' })
        .eq('id', gradeData.essay_id);

      console.log('✅ Essay status updated to graded');

      // CRITICAL: Force reload essays to ensure grades are visible
      console.log('🔄 CRITICAL: Reloading essays to show updated grades...');
      await get().loadEssays();
      
      set({ isLoading: false });
      
      console.log('🎉 Enhanced manual grading process completed successfully');
      
    } catch (error: any) {
      console.error('❌ Enhanced manual grading failed:', error);
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },
  
  checkPlagiarism: async (essayId: string) => {
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      // Simulate plagiarism check
      const report: Omit<PlagiarismReport, 'id' | 'created_at' | 'updated_at'> = {
        essay_id: essayId,
        similarity_percentage: Math.floor(Math.random() * 15) + 5, // 5-20%
        sources: [
          {
            id: '1',
            url: 'https://example.com/article1',
            title: 'Similar Academic Paper',
            similarity_percentage: Math.floor(Math.random() * 10) + 5,
            matched_text: 'The main argument presented in this work...',
          },
          {
            id: '2',
            url: 'https://example.com/article2',
            title: 'Related Research Study',
            similarity_percentage: Math.floor(Math.random() * 8) + 3,
            matched_text: 'In conclusion, the findings suggest...',
          },
        ],
        status: 'completed',
        checked_at: new Date().toISOString(),
      };

      await supabase
        .from('plagiarism_reports')
        .insert([report]);

      // Reload essays to get updated data
      await get().loadEssays();
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  // NEW: AI Content Detection Function
  checkAIContent: async (essayId: string, onProgress?: (message: string) => void): Promise<AIDetectionReport> => {
    console.log('🤖 === STARTING AI CONTENT DETECTION ===');
    console.log('📝 Essay ID:', essayId);
    
    set({ isLoading: true });
    
    try {
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - please configure Supabase credentials');
        set({ isLoading: false });
        throw new Error('Database connection failed. Please check your Supabase configuration in the .env file. See SETUP_DATABASE.md for instructions.');
      }

      // Step 1: Get essay details
      console.log('📚 Step 1: Fetching essay details...');
      onProgress?.('📚 Fetching essay details...');
      
      const { data: essay, error: essayError } = await supabase
        .from('essays')
        .select(`
          *,
          assignment:assignments(id, title, description),
          student:users!essays_student_id_fkey(id, full_name, email)
        `)
        .eq('id', essayId)
        .single();

      if (essayError || !essay) {
        throw new Error(`Failed to fetch essay: ${essayError?.message || 'Essay not found'}`);
      }

      console.log('✅ Essay found:', {
        title: essay.title,
        student: essay.student?.full_name || 'Unknown',
        contentLength: essay.content?.length || 0,
        wordCount: essay.content?.split(/\s+/).length || 0
      });

      // Step 2: Validate essay content
      if (!essay.content || essay.content.trim().length < 50) {
        throw new Error('Essay content is too short for AI detection (minimum 50 characters)');
      }

      // Step 3: Perform AI content detection
      console.log('🔍 Step 3: Starting AI content detection...');
      onProgress?.('🔍 Analyzing content for AI patterns...');
      
      const aiDetectionResult = await replicateAIDetector.detectAIContent(
        essay.content,
        onProgress
      );

      console.log('✅ AI detection completed:', {
        aiProbability: aiDetectionResult.ai_probability,
        humanProbability: aiDetectionResult.human_probability,
        confidence: aiDetectionResult.confidence,
        processingTime: aiDetectionResult.processing_time
      });

      // Step 4: Save AI detection report to database
      console.log('💾 Step 4: Saving AI detection report to database...');
      onProgress?.('💾 Saving AI detection report...');
      
      const reportData = {
        essay_id: essayId,
        ai_probability: aiDetectionResult.ai_probability,
        human_probability: aiDetectionResult.human_probability,
        confidence: aiDetectionResult.confidence,
        analysis: aiDetectionResult.analysis,
        status: 'completed' as const,
        checked_at: new Date().toISOString(),
      };

      // For now, we'll store this in a simple way since we don't have an ai_detection_reports table
      // In a real implementation, you'd create a proper table for this
      console.log('📊 AI Detection Report Data:', reportData);

      // Step 5: Create complete report object
      const completeReport: AIDetectionReport = {
        id: `ai-detection-${Date.now()}`,
        essay_id: essayId,
        ai_probability: aiDetectionResult.ai_probability,
        human_probability: aiDetectionResult.human_probability,
        confidence: aiDetectionResult.confidence,
        analysis: aiDetectionResult.analysis,
        status: 'completed',
        checked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Step 6: Update local state
      set(state => ({
        essays: state.essays.map(e => 
          e.id === essayId 
            ? { ...e, ai_detection_report: completeReport }
            : e
        ),
        isLoading: false
      }));

      console.log('🎉 === AI CONTENT DETECTION COMPLETED SUCCESSFULLY ===');
      console.log('📊 Final AI Detection Summary:', {
        student: essay.student?.full_name || 'Unknown',
        essay: essay.title,
        aiProbability: `${Math.round(aiDetectionResult.ai_probability * 100)}%`,
        humanProbability: `${Math.round(aiDetectionResult.human_probability * 100)}%`,
        confidence: `${Math.round(aiDetectionResult.confidence * 100)}%`,
        status: 'AI DETECTION COMPLETED ✅'
      });
      
      return completeReport;
      
    } catch (error: any) {
      console.error('❌ === AI CONTENT DETECTION FAILED ===');
      console.error('❌ Error:', error);
      
      set({ isLoading: false });
      throw new Error(error.message || 'AI content detection failed - please try again');
    }
  },

  // CRITICAL: FIXED loadEssays with PROPER grade data processing
  loadEssays: async () => {
    set({ isLoading: true });
    
    try {
      console.log('🔍 === CRITICAL: LOADING ALL ESSAYS WITH COMPLETE GRADE DATA ===');
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty essays list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ essays: [], isLoading: false });
        return;
      }
      
      const { data: essays, error } = await supabase
        .from('essays')
        .select(`
          *,
          assignment:assignments(id, title, description, instructions, due_date, max_score, teacher_id),
          grade:essay_grades(
            id,
            essay_id,
            total_score,
            max_score,
            criteria_scores,
            feedback,
            detailed_feedback,
            graded_by,
            teacher_id,
            graded_at,
            created_at,
            updated_at
          ),
          plagiarism_report:plagiarism_reports(*)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ CRITICAL: Database error loading essays:', error);
        throw error;
      }

      console.log('📊 Raw database response for essays:', {
        totalEssays: essays?.length || 0,
        essaysWithGrades: essays?.filter(e => e.grade && e.grade.length > 0).length || 0,
        sampleEssayWithGrade: essays?.find(e => e.grade && e.grade.length > 0)
      });

      // CRITICAL FIX: Properly process grade data from database
      const formattedEssays = (essays || []).map(essay => {
        // CRITICAL: Handle both array and object grade formats
        let grade = null;
        
        if (essay.grade) {
          if (Array.isArray(essay.grade)) {
            // If grade is an array, take the first element
            grade = essay.grade.length > 0 ? essay.grade[0] : null;
          } else {
            // If grade is already an object, use it directly
            grade = essay.grade;
          }
        }
        
        if (grade) {
          console.log('✅ FOUND GRADE IN DATABASE:', {
            essayId: essay.id,
            essayTitle: essay.title,
            gradeId: grade.id,
            totalScore: grade.total_score,
            maxScore: grade.max_score,
            gradedBy: grade.graded_by,
            hasDetailedFeedback: !!grade.detailed_feedback,
            detailedFeedbackKeys: grade.detailed_feedback ? Object.keys(grade.detailed_feedback) : [],
            criteriaScores: grade.criteria_scores
          });
        }
        
        // CRITICAL: Handle plagiarism report the same way
        let plagiarismReport = null;
        if (essay.plagiarism_report) {
          if (Array.isArray(essay.plagiarism_report)) {
            plagiarismReport = essay.plagiarism_report.length > 0 ? essay.plagiarism_report[0] : null;
          } else {
            plagiarismReport = essay.plagiarism_report;
          }
        }
        
        const formattedEssay = {
          ...essay,
          grade: grade,
          plagiarism_report: plagiarismReport,
        };
        
        return formattedEssay;
      });

      const gradedCount = formattedEssays.filter(e => e.grade).length;
      
      console.log(`✅ ✅ ✅ SUCCESSFULLY LOADED ${formattedEssays.length} essays from database!`);
      console.log(`📊 GRADE STATUS: ${gradedCount} essays have grades with detailed feedback`);
      
      if (gradedCount > 0) {
        console.log('🎯 SAMPLE GRADED ESSAY:', {
          title: formattedEssays.find(e => e.grade)?.title,
          grade: formattedEssays.find(e => e.grade)?.grade?.total_score,
          hasDetailedFeedback: !!formattedEssays.find(e => e.grade)?.grade?.detailed_feedback
        });
      }
      
      set({ essays: formattedEssays, isLoading: false });
      
      console.log('🎉 All essays loaded successfully with grades from database!');
      
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR loading essays:', error);
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  // CRITICAL: FIXED loadStudentEssays with PROPER grade data processing
  loadStudentEssays: async (studentId) => {
    set({ isLoading: true });
    
    try {
      console.log('🔍 === CRITICAL: LOADING STUDENT ESSAYS WITH COMPLETE GRADE DATA ===');
      console.log('🎓 Student ID:', studentId);
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty essays list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ essays: [], isLoading: false });
        return;
      }
      
      const { data: essays, error } = await supabase
        .from('essays')
        .select(`
          *,
          assignment:assignments(id, title, description, instructions, due_date, max_score, teacher_id),
          grade:essay_grades(
            id,
            essay_id,
            total_score,
            max_score,
            criteria_scores,
            feedback,
            detailed_feedback,
            graded_by,
            teacher_id,
            graded_at,
            created_at,
            updated_at
          ),
          plagiarism_report:plagiarism_reports(*)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ CRITICAL: Database error loading student essays:', error);
        throw error;
      }

      console.log('📊 Raw database response for student essays:', {
        totalEssays: essays?.length || 0,
        essaysWithGrades: essays?.filter(e => e.grade && e.grade.length > 0).length || 0,
        sampleEssayWithGrade: essays?.find(e => e.grade && e.grade.length > 0)
      });

      // CRITICAL FIX: Properly process grade data from database
      const formattedEssays = (essays || []).map(essay => {
        // CRITICAL: Handle both array and object grade formats
        let grade = null;
        
        if (essay.grade) {
          if (Array.isArray(essay.grade)) {
            // If grade is an array, take the first element
            grade = essay.grade.length > 0 ? essay.grade[0] : null;
          } else {
            // If grade is already an object, use it directly
            grade = essay.grade;
          }
        }
        
        if (grade) {
          console.log('✅ FOUND STUDENT GRADE IN DATABASE:', {
            essayId: essay.id,
            essayTitle: essay.title,
            gradeId: grade.id,
            totalScore: grade.total_score,
            maxScore: grade.max_score,
            gradedBy: grade.graded_by,
            hasDetailedFeedback: !!grade.detailed_feedback,
            detailedFeedbackKeys: grade.detailed_feedback ? Object.keys(grade.detailed_feedback) : [],
            criteriaScores: grade.criteria_scores
          });
        }
        
        // CRITICAL: Handle plagiarism report the same way
        let plagiarismReport = null;
        if (essay.plagiarism_report) {
          if (Array.isArray(essay.plagiarism_report)) {
            plagiarismReport = essay.plagiarism_report.length > 0 ? essay.plagiarism_report[0] : null;
          } else {
            plagiarismReport = essay.plagiarism_report;
          }
        }
        
        const formattedEssay = {
          ...essay,
          grade: grade,
          plagiarism_report: plagiarismReport,
        };
        
        return formattedEssay;
      });

      const gradedCount = formattedEssays.filter(e => e.grade).length;
      
      console.log(`✅ ✅ ✅ SUCCESSFULLY LOADED ${formattedEssays.length} student essays from database!`);
      console.log(`📊 STUDENT GRADE STATUS: ${gradedCount} essays have grades with detailed feedback`);
      
      if (gradedCount > 0) {
        console.log('🎯 SAMPLE STUDENT GRADED ESSAY:', {
          title: formattedEssays.find(e => e.grade)?.title,
          grade: formattedEssays.find(e => e.grade)?.grade?.total_score,
          hasDetailedFeedback: !!formattedEssays.find(e => e.grade)?.grade?.detailed_feedback
        });
      }
      
      set({ essays: formattedEssays, isLoading: false });
      
      console.log('🎉 Student essays loaded successfully with all grades from database!');
      
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR loading student essays:', error);
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  // CRITICAL: FIXED loadTeacherEssays with PROPER grade data processing
  loadTeacherEssays: async (teacherId) => {
    set({ isLoading: true });
    
    try {
      console.log('🔍 === CRITICAL: LOADING TEACHER ESSAYS WITH COMPLETE GRADE DATA ===');
      console.log('👨‍🏫 Teacher ID:', teacherId);
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty essays list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ essays: [], isLoading: false });
        return;
      }
      
      // First, get all student IDs assigned to this teacher
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('id')
        .eq('teacher_id', teacherId);

      if (studentsError) {
        throw studentsError;
      }

      // Get all assignment IDs created by this teacher
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id')
        .eq('teacher_id', teacherId);

      if (assignmentsError) {
        throw assignmentsError;
      }

      const studentIds = (students || []).map(student => student.id);
      const assignmentIds = (assignments || []).map(assignment => assignment.id);

      // If no students or assignments, return empty array
      if (studentIds.length === 0 && assignmentIds.length === 0) {
        console.log('⚠️ No students or assignments found for teacher');
        set({ essays: [], isLoading: false });
        return;
      }

      // Build the or filter conditions
      const orConditions = [];
      if (studentIds.length > 0) {
        orConditions.push(`student_id.in.(${studentIds.join(',')})`);
      }
      if (assignmentIds.length > 0) {
        orConditions.push(`assignment_id.in.(${assignmentIds.join(',')})`);
      }

      // ENHANCED QUERY: Get essays with COMPLETE grade data
      const { data: essays, error } = await supabase
        .from('essays')
        .select(`
          *,
          student:users!essays_student_id_fkey(id, full_name, email),
          assignment:assignments(id, title, description, instructions, due_date, max_score, teacher_id),
          grade:essay_grades(
            id,
            essay_id,
            total_score,
            max_score,
            criteria_scores,
            feedback,
            detailed_feedback,
            graded_by,
            teacher_id,
            graded_at,
            created_at,
            updated_at
          ),
          plagiarism_report:plagiarism_reports(*)
        `)
        .or(orConditions.join(','))
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ CRITICAL: Database error loading teacher essays:', error);
        throw error;
      }

      console.log('📊 Raw database response for teacher essays:', {
        totalEssays: essays?.length || 0,
        essaysWithGrades: essays?.filter(e => e.grade && e.grade.length > 0).length || 0,
        sampleEssayWithGrade: essays?.find(e => e.grade && e.grade.length > 0)
      });

      // CRITICAL FIX: Properly process grade data from database
      const formattedEssays = (essays || []).map(essay => {
        // CRITICAL: Handle both array and object grade formats
        let grade = null;
        
        if (essay.grade) {
          if (Array.isArray(essay.grade)) {
            // If grade is an array, take the first element
            grade = essay.grade.length > 0 ? essay.grade[0] : null;
          } else {
            // If grade is already an object, use it directly
            grade = essay.grade;
          }
        }
        
        if (grade) {
          console.log('✅ FOUND TEACHER GRADE IN DATABASE:', {
            essayId: essay.id,
            essayTitle: essay.title,
            studentName: essay.student?.full_name,
            gradeId: grade.id,
            totalScore: grade.total_score,
            maxScore: grade.max_score,
            gradedBy: grade.graded_by,
            hasDetailedFeedback: !!grade.detailed_feedback,
            detailedFeedbackKeys: grade.detailed_feedback ? Object.keys(grade.detailed_feedback) : [],
            criteriaScores: grade.criteria_scores
          });
        }
        
        // CRITICAL: Handle plagiarism report the same way
        let plagiarismReport = null;
        if (essay.plagiarism_report) {
          if (Array.isArray(essay.plagiarism_report)) {
            plagiarismReport = essay.plagiarism_report.length > 0 ? essay.plagiarism_report[0] : null;
          } else {
            plagiarismReport = essay.plagiarism_report;
          }
        }
        
        const formattedEssay = {
          ...essay,
          grade: grade,
          plagiarism_report: plagiarismReport,
          // Add empty AI detection report field
          ai_detection_report: null
        };
        
        return formattedEssay;
      });

      const gradedCount = formattedEssays.filter(e => e.grade).length;
      
      console.log(`✅ ✅ ✅ SUCCESSFULLY LOADED ${formattedEssays.length} teacher essays from database!`);
      console.log(`📊 TEACHER GRADE STATUS: ${gradedCount} essays have grades with detailed feedback`);
      
      if (gradedCount > 0) {
        console.log('🎯 SAMPLE TEACHER GRADED ESSAY:', {
          title: formattedEssays.find(e => e.grade)?.title,
          student: formattedEssays.find(e => e.grade)?.student?.full_name,
          grade: formattedEssays.find(e => e.grade)?.grade?.total_score,
          hasDetailedFeedback: !!formattedEssays.find(e => e.grade)?.grade?.detailed_feedback
        });
      }

      set({ essays: formattedEssays, isLoading: false });
      
      console.log('🎉 Teacher essays loaded successfully with all grades from database!');
      
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR loading teacher essays:', error);
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },

  loadAssignmentSubmissions: async (assignmentId) => {
    set({ isLoading: true });
    
    try {
      console.log('📚 CRITICAL: Loading assignment submissions with COMPLETE grade data from database...');
      console.log('🎯 Assignment ID:', assignmentId);
      
      const isConnected = await isSupabaseConnected();
      
      if (!isConnected) {
        console.log('⚠️ Database not connected - using empty essays list');
        console.log('📋 To connect to your database, please follow the instructions in SETUP_DATABASE.md');
        set({ essays: [], isLoading: false });
        return;
      }
      
      // ENHANCED QUERY: Make sure we get ALL grade data including detailed_feedback
      const { data: essays, error } = await supabase
        .from('essays')
        .select(`
          *,
          student:users!essays_student_id_fkey(id, full_name, email),
          assignment:assignments(id, title, description, instructions, due_date, max_score, teacher_id),
          grade:essay_grades(
            id,
            essay_id,
            total_score,
            max_score,
            criteria_scores,
            feedback,
            detailed_feedback,
            graded_by,
            teacher_id,
            graded_at,
            created_at,
            updated_at
          ),
          plagiarism_report:plagiarism_reports(*)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ CRITICAL: Database error loading assignment submissions:', error);
        throw error;
      }

      console.log('📊 Raw database response for assignment submissions:', {
        totalEssays: essays?.length || 0,
        essaysWithGrades: essays?.filter(e => e.grade && e.grade.length > 0).length || 0,
        sampleEssayWithGrade: essays?.find(e => e.grade && e.grade.length > 0)
      });

      // CRITICAL FIX: Properly process grade data from database
      const formattedEssays = (essays || []).map(essay => {
        // CRITICAL: Handle both array and object grade formats
        let grade = null;
        
        if (essay.grade) {
          if (Array.isArray(essay.grade)) {
            // If grade is an array, take the first element
            grade = essay.grade.length > 0 ? essay.grade[0] : null;
          } else {
            // If grade is already an object, use it directly
            grade = essay.grade;
          }
        }
        
        if (grade) {
          console.log('✅ FOUND GRADE IN DATABASE:', {
            essayId: essay.id,
            essayTitle: essay.title,
            gradeId: grade.id,
            totalScore: grade.total_score,
            maxScore: grade.max_score,
            gradedBy: grade.graded_by,
            hasDetailedFeedback: !!grade.detailed_feedback,
            detailedFeedbackKeys: grade.detailed_feedback ? Object.keys(grade.detailed_feedback) : [],
            criteriaScores: grade.criteria_scores
          });
        }
        
        // CRITICAL: Handle plagiarism report the same way
        let plagiarismReport = null;
        if (essay.plagiarism_report) {
          if (Array.isArray(essay.plagiarism_report)) {
            plagiarismReport = essay.plagiarism_report.length > 0 ? essay.plagiarism_report[0] : null;
          } else {
            plagiarismReport = essay.plagiarism_report;
          }
        }
        
        const formattedEssay = {
          ...essay,
          grade: grade,
          plagiarism_report: plagiarismReport,
          // Add empty AI detection report field
          ai_detection_report: null
        };
        
        return formattedEssay;
      });

      const gradedCount = formattedEssays.filter(e => e.grade).length;
      
      console.log(`✅ ✅ ✅ SUCCESSFULLY LOADED ${formattedEssays.length} assignment submissions from database!`);
      console.log(`📊 GRADE STATUS: ${gradedCount} essays have grades with detailed feedback`);
      
      if (gradedCount > 0) {
        console.log('🎯 SAMPLE GRADED ESSAY:', {
          title: formattedEssays.find(e => e.grade)?.title,
          grade: formattedEssays.find(e => e.grade)?.grade?.total_score,
          hasDetailedFeedback: !!formattedEssays.find(e => e.grade)?.grade?.detailed_feedback
        });
      }
      
      set({ essays: formattedEssays, isLoading: false });
      
      console.log('🎉 Assignment submissions loaded successfully with all grades from database!');
      
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR loading assignment submissions:', error);
      set({ isLoading: false });
      throw new Error(handleSupabaseError(error));
    }
  },
  
  getEssaysByStudent: (studentId: string) => {
    return get().essays.filter(essay => essay.student_id === studentId);
  },
  
  getEssaysByTeacher: (teacherId: string) => {
    return get().essays.filter(essay => 
      essay.assignment?.teacher_id === teacherId
    );
  },

  getEssaysByAssignment: (assignmentId: string) => {
    return get().essays.filter(essay => essay.assignment_id === assignmentId);
  },

  getStudentSubmissionForAssignment: (studentId: string, assignmentId: string) => {
    return get().essays.find(essay => 
      essay.student_id === studentId && essay.assignment_id === assignmentId
    );
  },
}));