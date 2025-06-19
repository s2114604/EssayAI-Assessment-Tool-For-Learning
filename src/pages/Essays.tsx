import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Eye, Award, Shield, User, CheckCircle, AlertCircle, Star, Bot, Edit, Users, Brain } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EssaySubmissionForm } from '../components/essay/EssaySubmissionForm';
import { EssayGradeDisplay } from '../components/essay/EssayGradeDisplay';
import { PlagiarismReport } from '../components/essay/PlagiarismReport';
import { AIDetectionReport } from '../components/essay/AIDetectionReport';
import { StudentSubmissionCard } from '../components/essay/StudentSubmissionCard';
import { TeacherSubmissionView } from '../components/essay/TeacherSubmissionView';
import { GradingModal } from '../components/grading/GradingModal';
import { useEssayStore } from '../store/essayStore';
import { useAuthStore } from '../store/authStore';
import { Essay, EssayGrade } from '../types';
import toast from 'react-hot-toast';

export const Essays: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [editingEssay, setEditingEssay] = useState<Essay | null>(null);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [viewMode, setViewMode] = useState<'grade' | 'plagiarism' | 'ai-detection' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingEssay, setGradingEssay] = useState<Essay | null>(null);
  
  const { 
    essays, 
    gradeEssayWithAI,
    checkPlagiarism,
    checkAIContent,
    updateEssay,
    deleteEssay,
    loadStudentEssays,
    loadTeacherEssays,
    loadAssignmentSubmissions,
    submitManualGrade,
    isLoading 
  } = useEssayStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      console.log('🔄 === CRITICAL: LOADING ESSAYS WITH GRADES FOR USER ===');
      console.log('👤 User:', user.full_name, 'Role:', user.role);
      
      if (user.role === 'student') {
        console.log('🎓 Loading student essays with grades for:', user.full_name);
        loadStudentEssays(user.id);
      } else if (user.role === 'teacher') {
        console.log('👨‍🏫 Loading teacher essays with grades for:', user.full_name);
        loadTeacherEssays(user.id);
      }
    }
  }, [user, loadStudentEssays, loadTeacherEssays]);

  // ENHANCED AI GRADING FUNCTION WITH PROPER RELOAD
  const handleAIGradeEssay = async (essayId: string) => {
    try {
      console.log('🤖 Starting AI grading for essay:', essayId);
      
      const loadingToast = toast.loading('🤖 AI is grading the essay and saving to database...', {
        duration: 0,
      });
      
      const gradeResult = await gradeEssayWithAI(essayId);
      
      toast.dismiss(loadingToast);
      
      console.log('✅ AI grading completed and saved:', gradeResult);
      
      // Show success message
      toast.success(`🎉 AI Grading Complete & Saved!

Score: ${gradeResult.total_score}/${gradeResult.max_score} (${Math.round((gradeResult.total_score / gradeResult.max_score) * 100)}%)

Grade has been saved to database!`, { 
        duration: 5000,
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line'
        }
      });
      
      // Find the essay and show the grade immediately
      const gradedEssay = essays.find(e => e.id === essayId);
      if (gradedEssay) {
        const essayWithGrade = {
          ...gradedEssay,
          grade: gradeResult,
          status: 'graded' as const
        };
        
        console.log('📊 Auto-opening grade view');
        
        // Show the detailed grade analysis
        setTimeout(() => {
          setSelectedEssay(essayWithGrade);
          setViewMode('grade');
          toast.success('Grade details are now displayed below!', {
            duration: 3000
          });
        }, 1000);
      }
      
      // CRITICAL: Force reload essays to ensure grades are visible
      console.log('🔄 === CRITICAL: FORCE RELOADING ESSAYS TO SHOW GRADES ===');
      setTimeout(() => {
        if (user?.role === 'student') {
          console.log('🔄 Reloading student essays after AI grading');
          loadStudentEssays(user.id);
        } else if (user?.role === 'teacher') {
          console.log('🔄 Reloading teacher essays after AI grading');
          // Check if we're in assignment context by looking at the essay
          const essay = essays.find(e => e.id === essayId);
          if (essay?.assignment_id) {
            console.log('🔄 Reloading assignment submissions for assignment:', essay.assignment_id);
            loadAssignmentSubmissions(essay.assignment_id);
          } else {
            console.log('🔄 Reloading all teacher essays');
            loadTeacherEssays(user.id);
          }
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ AI grading failed:', error);
      toast.error(`❌ AI Grading Failed: ${error.message}`, {
        duration: 4000
      });
    }
  };

  // NEW: AI Content Detection Function
  const handleCheckAIContent = async (essayId: string) => {
    try {
      console.log('🧠 Starting AI content detection for essay:', essayId);
      
      const loadingToast = toast.loading('🧠 Analyzing content for AI patterns...', {
        duration: 0,
      });
      
      const detectionResult = await checkAIContent(essayId, (message) => {
        toast.loading(message, { id: loadingToast });
      });
      
      toast.dismiss(loadingToast);
      
      console.log('✅ AI content detection completed:', detectionResult);
      
      // Show success message with probability
      const aiProbability = Math.round(detectionResult.ai_probability * 100);
      
      let toastStyle = {};
      let toastMessage = '';
      
      if (aiProbability >= 70) {
        toastStyle = { style: { backgroundColor: '#FEE2E2', color: '#B91C1C' } };
        toastMessage = `⚠️ High AI probability detected: ${aiProbability}%`;
      } else if (aiProbability >= 40) {
        toastStyle = { style: { backgroundColor: '#FEF3C7', color: '#92400E' } };
        toastMessage = `⚠️ Moderate AI probability detected: ${aiProbability}%`;
      } else {
        toastStyle = { style: { backgroundColor: '#D1FAE5', color: '#065F46' } };
        toastMessage = `✅ Low AI probability detected: ${aiProbability}%`;
      }
      
      toast.success(toastMessage, { 
        duration: 5000,
        ...toastStyle
      });
      
      // Find the essay and show the AI detection report
      const analyzedEssay = essays.find(e => e.id === essayId);
      if (analyzedEssay) {
        const essayWithDetection = {
          ...analyzedEssay,
          ai_detection_report: detectionResult
        };
        
        console.log('🧠 Auto-opening AI detection report');
        
        // Show the detailed AI detection report
        setTimeout(() => {
          setSelectedEssay(essayWithDetection);
          setViewMode('ai-detection');
          toast.success('AI detection report is now displayed below!', {
            duration: 3000
          });
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('❌ AI content detection failed:', error);
      toast.error(`❌ AI Content Detection Failed: ${error.message}`, {
        duration: 4000
      });
    }
  };

  const handleGradeEssay = (essay: Essay) => {
    console.log('📝 Opening manual grading for essay:', essay.title);
    setGradingEssay(essay);
    setShowGradingModal(true);
  };

  const handleGradeSubmit = async (gradeData: any) => {
    try {
      console.log('💾 Submitting grade data:', gradeData);
      await submitManualGrade(gradeData);
      setShowGradingModal(false);
      setGradingEssay(null);
      toast.success('Essay graded successfully!');
      
      // CRITICAL: Force reload essays to ensure grades are visible
      console.log('🔄 === CRITICAL: FORCE RELOADING ESSAYS AFTER MANUAL GRADING ===');
      setTimeout(() => {
        if (user?.role === 'student') {
          loadStudentEssays(user.id);
        } else if (user?.role === 'teacher') {
          // Check if we're in assignment context
          const essay = essays.find(e => e.id === gradeData.essay_id);
          if (essay?.assignment_id) {
            console.log('🔄 Reloading assignment submissions after manual grading');
            loadAssignmentSubmissions(essay.assignment_id);
          } else {
            loadTeacherEssays(user.id);
          }
        }
      }, 1000);
    } catch (error: any) {
      console.error('❌ Grade submission failed:', error);
      toast.error(error.message || 'Failed to grade essay');
    }
  };

  const handleCheckPlagiarism = async (essayId: string) => {
    try {
      await checkPlagiarism(essayId);
      toast.success('Plagiarism check completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to check plagiarism');
    }
  };

  const handleEditEssay = (essay: Essay) => {
    setEditingEssay(essay);
    setShowSubmissionForm(true);
  };

  const handleReuploadEssay = (essay: Essay) => {
    setEditingEssay(essay);
    setShowSubmissionForm(true);
  };

  const handleViewEssay = (essay: Essay) => {
    if (essay.grade) {
      console.log('📊 Viewing grade for essay:', essay.title);
      setSelectedEssay(essay);
      setViewMode('grade');
    } else {
      toast.info('This essay has not been graded yet.');
    }
  };

  const handleDeleteEssay = async (essayId: string) => {
    try {
      await deleteEssay(essayId);
      toast.success('Essay deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error('Failed to delete essay');
    }
  };

  const handleFormSubmit = async (essayData: any) => {
    try {
      if (editingEssay) {
        await updateEssay(editingEssay.id, essayData);
        toast.success('Essay updated successfully');
      }
      setShowSubmissionForm(false);
      setEditingEssay(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save essay');
    }
  };

  const handleViewGrade = (essay: Essay) => {
    if (essay.grade) {
      console.log('📊 Opening detailed grade for:', essay.title);
      setSelectedEssay(essay);
      setViewMode('grade');
    } else {
      toast.error('This essay has not been graded yet.');
    }
  };

  const handleViewPlagiarism = (essay: Essay) => {
    if (essay.plagiarism_report) {
      setSelectedEssay(essay);
      setViewMode('plagiarism');
    } else {
      toast.error('No plagiarism report available.');
    }
  };

  const handleViewAIDetection = (essay: Essay) => {
    if (essay.ai_detection_report) {
      console.log('🧠 Opening AI detection report for:', essay.title);
      setSelectedEssay(essay);
      setViewMode('ai-detection');
    } else {
      toast.error('No AI detection report available.');
    }
  };

  const filteredEssays = essays.filter(essay => {
    const matchesSearch = essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (essay.content && essay.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || essay.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getPageTitle = () => {
    switch (user?.role) {
      case 'student': return 'My Submissions';
      case 'teacher': return '🎯 Grade Student Essays';
      default: return 'Essays';
    }
  };

  const getEmptyStateMessage = () => {
    switch (user?.role) {
      case 'student': return 'You haven\'t submitted any essays yet';
      case 'teacher': return 'No student submissions found.';
      default: return 'No essays found';
    }
  };

  // Calculate statistics
  const teacherGradedCount = essays.filter(e => e.grade?.graded_by === 'teacher').length;
  const aiGradedCount = essays.filter(e => e.grade?.graded_by === 'ai').length;
  const totalGraded = essays.filter(e => e.grade).length;
  const ungradedCount = essays.filter(e => e.status === 'submitted' && !e.grade).length;
  const aiDetectedCount = essays.filter(e => e.ai_detection_report).length;

  // CRITICAL: Debug grade visibility
  useEffect(() => {
    console.log('🔍 === CRITICAL: ESSAYS PAGE GRADE DEBUG ===');
    console.log('📊 Total essays loaded:', essays.length);
    console.log('📊 Essays with grades:', totalGraded);
    console.log('📊 AI graded essays:', aiGradedCount);
    console.log('📊 Teacher graded essays:', teacherGradedCount);
    console.log('📊 Ungraded essays:', ungradedCount);
    console.log('🧠 Essays with AI detection:', aiDetectedCount);
    
    if (totalGraded > 0) {
      const sampleGradedEssay = essays.find(e => e.grade);
      console.log('🎯 Sample graded essay:', {
        title: sampleGradedEssay?.title,
        hasGrade: !!sampleGradedEssay?.grade,
        gradeScore: sampleGradedEssay?.grade?.total_score,
        gradedBy: sampleGradedEssay?.grade?.graded_by
      });
    }
  }, [essays, totalGraded, aiGradedCount, teacherGradedCount, ungradedCount, aiDetectedCount]);

  if (isLoading && essays.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading essays...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'student' 
              ? 'Manage your essay submissions and view AI analysis'
              : 'Review and grade student essays with AI analysis or manual grading'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role === 'student' && (
            <Button
              variant="primary"
              onClick={() => setShowSubmissionForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Essay</span>
            </Button>
          )}
        </div>
      </div>

      {/* ENHANCED Stats Cards with Grade Visibility */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{essays.length}</div>
          <div className="text-sm text-gray-600">Total Essays</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{teacherGradedCount}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
            <User className="w-3 h-3" />
            <span>Teacher Graded</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{aiGradedCount}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
            <Bot className="w-3 h-3" />
            <span>AI Graded</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{ungradedCount}</div>
          <div className="text-sm text-gray-600">Awaiting Grade</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{aiDetectedCount}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
            <Brain className="w-3 h-3" />
            <span>AI Detected</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {totalGraded > 0 ? Math.round((totalGraded / essays.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </Card>
      </div>

      {/* ENHANCED Grade Visibility Banner */}
      {totalGraded > 0 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-900">
                  🎉 {totalGraded} Essay{totalGraded !== 1 ? 's' : ''} Graded & Ready to View!
                </h3>
                <p className="text-xs text-green-700">
                  {teacherGradedCount} by teacher, {aiGradedCount} by AI - All grades are now visible below
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">Click any graded essay to view detailed analysis</span>
            </div>
          </div>
        </Card>
      )}

      {/* AI Detection Banner */}
      {aiDetectedCount > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-purple-900">
                  🧠 {aiDetectedCount} Essay{aiDetectedCount !== 1 ? 's' : ''} Analyzed for AI Content
                </h3>
                <p className="text-xs text-purple-700">
                  AI detection helps identify potentially AI-generated content
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-purple-800">Click "View AI Analysis" to see detailed reports</span>
            </div>
          </div>
        </Card>
      )}

      {/* Teacher Grading Banner */}
      {user?.role === 'teacher' && ungradedCount > 0 && (
        <Card className="p-6 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-2 border-orange-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Edit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-1">
                  🎯 {ungradedCount} Essay{ungradedCount !== 1 ? 's' : ''} Ready for AI Grading!
                </h3>
                <p className="text-orange-700 mb-2">
                  Students are waiting for grades. Use simple AI grading for instant results.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">Simple AI Grading Available</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-700">AI Content Detection Available</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">Grading System Ready</span>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      {(essays.length > 0 || searchTerm || filterStatus !== 'all') && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search essays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="grading">Grading</option>
                <option value="graded">Graded</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* ENHANCED Essays List with Grade Visibility */}
      <div className="space-y-6">
        {filteredEssays.map((essay) => {
          // CRITICAL: Debug each essay's grade status
          console.log('🔍 Essay render debug:', {
            id: essay.id,
            title: essay.title,
            hasGrade: !!essay.grade,
            gradeScore: essay.grade?.total_score,
            gradedBy: essay.grade?.graded_by,
            status: essay.status,
            hasAIDetection: !!essay.ai_detection_report
          });
          
          return (
            <div key={essay.id}>
              {user?.role === 'student' ? (
                <StudentSubmissionCard
                  essay={essay}
                  onEdit={handleEditEssay}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onReupload={handleReuploadEssay}
                  onView={handleViewEssay}
                />
              ) : (
                <TeacherSubmissionView
                  essay={essay}
                  onGrade={handleGradeEssay}
                  onAIGrade={handleAIGradeEssay}
                  onCheckPlagiarism={handleCheckPlagiarism}
                  onCheckAIContent={handleCheckAIContent}
                  onViewGrade={handleViewGrade}
                  onViewPlagiarism={handleViewPlagiarism}
                  onViewAIDetection={handleViewAIDetection}
                  isLoading={isLoading}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEssays.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No essays found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : getEmptyStateMessage()
            }
          </p>
          {user?.role === 'student' && (
            <Button variant="primary" onClick={() => setShowSubmissionForm(true)}>
              Submit Your First Essay
            </Button>
          )}
        </Card>
      )}

      {/* Modals */}
      <Modal
        isOpen={showSubmissionForm}
        onClose={() => {
          setShowSubmissionForm(false);
          setEditingEssay(null);
        }}
        title={editingEssay ? 'Edit Essay' : 'Submit New Essay'}
        size="xl"
      >
        <EssaySubmissionForm 
          essay={editingEssay}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowSubmissionForm(false);
            setEditingEssay(null);
          }} 
        />
      </Modal>

      <Modal
        isOpen={viewMode === 'grade' && !!selectedEssay}
        onClose={() => {
          setSelectedEssay(null);
          setViewMode(null);
        }}
        title="📊 Grade Analysis"
        size="xl"
      >
        {selectedEssay?.grade && (
          <EssayGradeDisplay grade={selectedEssay.grade} />
        )}
      </Modal>

      <Modal
        isOpen={viewMode === 'plagiarism' && !!selectedEssay}
        onClose={() => {
          setSelectedEssay(null);
          setViewMode(null);
        }}
        title="Plagiarism Report"
        size="lg"
      >
        {selectedEssay?.plagiarism_report && <PlagiarismReport report={selectedEssay.plagiarism_report} />}
      </Modal>

      <Modal
        isOpen={viewMode === 'ai-detection' && !!selectedEssay}
        onClose={() => {
          setSelectedEssay(null);
          setViewMode(null);
        }}
        title="AI Content Detection Analysis"
        size="lg"
      >
        {selectedEssay?.ai_detection_report && <AIDetectionReport report={selectedEssay.ai_detection_report} />}
      </Modal>

      {/* Grading Modal */}
      {showGradingModal && gradingEssay && (
        <GradingModal
          isOpen={showGradingModal}
          onClose={() => {
            console.log('🔄 Closing grading modal');
            setShowGradingModal(false);
            setGradingEssay(null);
          }}
          essay={gradingEssay}
          onGradeSubmit={handleGradeSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Essay</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this essay? This action cannot be undone.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDeleteEssay(showDeleteConfirm)}
              loading={isLoading}
            >
              Delete Essay
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};