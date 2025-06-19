import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Award, Clock, Download, Eye, MessageSquare, ArrowLeft, Filter, Search, User as UserIcon, CheckCircle, AlertCircle, Star, Edit, Bot, Brain } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { EssayGradeDisplay } from '../essay/EssayGradeDisplay';
import { PlagiarismReport } from '../essay/PlagiarismReport';
import { AIDetectionReport } from '../essay/AIDetectionReport';
import { GradingModal } from '../grading/GradingModal';
import { Assignment, Essay } from '../../types';
import { useEssayStore } from '../../store/essayStore';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

interface AssignmentSubmissionsViewProps {
  assignment: Assignment;
  onBack: () => void;
}

export const AssignmentSubmissionsView: React.FC<AssignmentSubmissionsViewProps> = ({
  assignment,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [viewMode, setViewMode] = useState<'grade' | 'plagiarism' | 'ai-detection' | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingEssay, setGradingEssay] = useState<Essay | null>(null);

  const { 
    essays, 
    loadAssignmentSubmissions, 
    submitManualGrade,
    gradeEssayWithAI,
    checkPlagiarism,
    checkAIContent,
    isLoading 
  } = useEssayStore();
  
  const { users, loadUsers } = useUserStore();

  useEffect(() => {
    console.log('📚 Loading assignment submissions for:', assignment.title);
    loadAssignmentSubmissions(assignment.id);
    loadUsers();
  }, [assignment.id, loadAssignmentSubmissions, loadUsers]);

  const handleGradeEssay = (essay: Essay) => {
    console.log('📝 Opening grading modal for essay:', essay.title);
    setGradingEssay(essay);
    setShowGradingModal(true);
  };

  const handleAIGradeEssay = async (essayId: string) => {
    try {
      console.log('🤖 Starting comprehensive AI grading with database storage for essay:', essayId);
      
      const loadingToast = toast.loading('🤖 AI is comprehensively grading the essay and saving to database...');
      
      const gradeResult = await gradeEssayWithAI(essayId);
      
      toast.dismiss(loadingToast);
      
      console.log('✅ AI grading completed and saved to database:', gradeResult);
      
      toast.success(`🎉 AI Grading Complete & Saved! Score: ${gradeResult.total_score}/${gradeResult.max_score} (${Math.round((gradeResult.total_score / gradeResult.max_score) * 100)}%) - Essay marked as GRADED`, { duration: 6000 });
      
      // Find the essay and show the grade immediately
      const gradedEssay = essays.find(e => e.id === essayId);
      if (gradedEssay) {
        const essayWithGrade = {
          ...gradedEssay,
          grade: gradeResult,
          status: 'graded' as const
        };
        
        console.log('📊 Auto-opening detailed AI grade analysis view');
        
        // Show the detailed grade analysis immediately
        setTimeout(() => {
          setSelectedEssay(essayWithGrade);
          setViewMode('grade');
          toast.success('🎯 Detailed AI analysis ready! View complete scoring breakdown below.', {
            duration: 5000
          });
        }, 1000);
      }
      
      // Reload submissions to show updated data
      setTimeout(() => {
        loadAssignmentSubmissions(assignment.id);
      }, 500); // Faster reload to show updated status
      
    } catch (error: any) {
      console.error('❌ AI grading and database storage failed:', error);
      toast.error(`AI Grading Failed: ${error.message || 'Please try again - essay not marked as graded'}`);
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
      
      // Reload submissions to show updated data
      setTimeout(() => {
        loadAssignmentSubmissions(assignment.id);
      }, 500);
      
    } catch (error: any) {
      console.error('❌ AI content detection failed:', error);
      toast.error(`❌ AI Content Detection Failed: ${error.message}`, {
        duration: 4000
      });
    }
  };

  const handleGradeSubmit = async (gradeData: any) => {
    try {
      console.log('💾 Submitting grade data:', gradeData);
      await submitManualGrade(gradeData);
      setShowGradingModal(false);
      setGradingEssay(null);
      toast.success('Essay graded successfully! Grade details are now visible to the student.');
      
      // Reload submissions to show updated grades
      setTimeout(() => {
        loadAssignmentSubmissions(assignment.id);
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

  const handleViewGrade = (essay: Essay) => {
    if (essay.grade) {
      console.log('📊 Viewing detailed grade for essay:', essay.title);
      setSelectedEssay(essay);
      setViewMode('grade');
    } else {
      toast.error('This essay has not been graded yet. Please grade it first.');
    }
  };

  const handleViewPlagiarism = (essay: Essay) => {
    if (essay.plagiarism_report) {
      setSelectedEssay(essay);
      setViewMode('plagiarism');
    } else {
      toast.error('No plagiarism report available for this essay.');
    }
  };

  const handleViewAIDetection = (essay: Essay) => {
    if (essay.ai_detection_report) {
      console.log('🧠 Opening AI detection report for:', essay.title);
      setSelectedEssay(essay);
      setViewMode('ai-detection');
    } else {
      toast.error('No AI detection report available for this essay.');
    }
  };

  // Get students assigned to this teacher
  const assignedStudents = users.filter(user => 
    user.role === 'student' && user.teacher_id === assignment.teacher_id
  );

  // Filter submissions based on search and status
  const filteredSubmissions = essays.filter(essay => {
    const student = users.find(u => u.id === essay.student_id);
    const matchesSearch = essay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || essay.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'grading': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLetter = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 65) return 'D';
    return 'F';
  };

  const getAIProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-600';
    if (probability >= 0.7) return 'text-red-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    return teacher ? teacher.full_name : 'Unknown Teacher';
  };

  const getStudentsByTeacher = (teacherId: string) => {
    return users.filter(user => user.role === 'student' && user.teacher_id === teacherId);
  };

  const isOverdue = new Date(assignment.due_date) < new Date();
  const submissionRate = assignedStudents.length > 0 
    ? Math.round((essays.length / assignedStudents.length) * 100) 
    : 0;

  const gradedCount = essays.filter(e => e.grade).length;
  const averageGrade = gradedCount > 0 
    ? Math.round(essays.filter(e => e.grade).reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / gradedCount)
    : 0;

  const ungradedCount = essays.filter(e => e.status === 'submitted' && !e.grade).length;
  const aiDetectedCount = essays.filter(e => e.ai_detection_report).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments</span>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600">Assignment Submissions & Grading</p>
        </div>
      </div>

      {/* Assignment Info & Grading Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{essays.length}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
            <div className="text-sm text-gray-600">Graded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{ungradedCount}</div>
            <div className="text-sm text-gray-600">Awaiting Grade</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{submissionRate}%</div>
            <div className="text-sm text-gray-600">Submission Rate</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${averageGrade > 0 ? getGradeColor(averageGrade) : 'text-gray-400'}`}>
              {averageGrade > 0 ? `${averageGrade}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Class Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{aiDetectedCount}</div>
            <div className="text-sm text-gray-600">AI Detected</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Due Date:</strong> {new Date(assignment.due_date).toLocaleDateString()} at {new Date(assignment.due_date).toLocaleTimeString()}
              {isOverdue && <span className="text-red-600 ml-2">(Overdue)</span>}
            </div>
            <div>
              <strong>Max Score:</strong> {assignment.max_score} points
            </div>
            <div>
              <strong>Assigned Students:</strong> {assignedStudents.length}
            </div>
            <div>
              <strong>Grade Distribution:</strong> {
                gradedCount > 0 ? (
                  <span>
                    A: {essays.filter(e => e.grade && (e.grade.total_score / e.grade.max_score) >= 0.9).length}, 
                    B: {essays.filter(e => e.grade && (e.grade.total_score / e.grade.max_score) >= 0.8 && (e.grade.total_score / e.grade.max_score) < 0.9).length}, 
                    C: {essays.filter(e => e.grade && (e.grade.total_score / e.grade.max_score) >= 0.7 && (e.grade.total_score / e.grade.max_score) < 0.8).length}, 
                    D/F: {essays.filter(e => e.grade && (e.grade.total_score / e.grade.max_score) < 0.7).length}
                  </span>
                ) : 'No grades yet'
              }
            </div>
          </div>
        </div>

        {/* Grading Info */}
        {ungradedCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {ungradedCount} essay{ungradedCount !== 1 ? 's' : ''} ready for grading
                  </div>
                  <div className="text-xs text-gray-600">
                    Use AI grading for instant feedback or manual grading for custom scoring
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Grading System Ready</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Students without submissions */}
      {assignedStudents.length > essays.length && (
        <Card className="p-4 bg-orange-50 border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-medium text-orange-800">Students who haven't submitted:</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {assignedStudents
              .filter(student => !essays.some(essay => essay.student_id === student.id))
              .map(student => (
                <span key={student.id} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {student.full_name}
                </span>
              ))
            }
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by student name, email, or essay title..."
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
              <option value="all">All Submissions</option>
              <option value="submitted">Submitted</option>
              <option value="grading">Grading</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length > 0 ? (
          filteredSubmissions.map((essay) => {
            const student = users.find(u => u.id === essay.student_id);
            
            return (
              <Card key={essay.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student?.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{essay.title}</h3>
                        <p className="text-sm text-gray-600">
                          by {student?.full_name || 'Unknown Student'} ({student?.email || 'No email'})
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(essay.status)}`}>
                        {essay.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 line-clamp-2">{essay.content}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Submitted: {new Date(essay.submitted_at).toLocaleDateString()}</span>
                  </div>
                  {essay.file_name && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{essay.file_name}</span>
                    </div>
                  )}
                  {essay.grade && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-lg ${getGradeColor(essay.grade.total_score)}`}>
                          {getGradeLetter(essay.grade.total_score, essay.grade.max_score)}
                        </span>
                        <span className={`font-medium ${getGradeColor(essay.grade.total_score)}`}>
                          {essay.grade.total_score}/{essay.grade.max_score} ({Math.round((essay.grade.total_score / essay.grade.max_score) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                  {essay.ai_detection_report && (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span className={`font-medium ${getAIProbabilityColor(essay.ai_detection_report.ai_probability)}`}>
                        AI: {Math.round(essay.ai_detection_report.ai_probability * 100)}%
                      </span>
                    </div>
                  )}
                  {essay.plagiarism_report && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span className={`font-medium ${
                        essay.plagiarism_report.similarity_percentage < 10 ? 'text-green-600' :
                        essay.plagiarism_report.similarity_percentage < 25 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        Similarity: {essay.plagiarism_report.similarity_percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Enhanced Grade Display */}
                {essay.grade && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Graded</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`text-2xl font-bold ${getGradeColor(essay.grade.total_score)}`}>
                          {getGradeLetter(essay.grade.total_score, essay.grade.max_score)}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getGradeColor(essay.grade.total_score)}`}>
                            {essay.grade.total_score}/{essay.grade.max_score}
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round((essay.grade.total_score / essay.grade.max_score) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Criteria Breakdown Preview */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {Object.entries(essay.grade.criteria_scores).map(([key, score]) => (
                        <div key={key} className="text-center">
                          <div className={`text-sm font-bold ${getGradeColor(score)}`}>
                            {score}/20
                          </div>
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {essay.grade.feedback && (
                      <p className="text-sm text-gray-700 line-clamp-2 italic">
                        "{essay.grade.feedback.substring(0, 150)}..."
                      </p>
                    )}
                  </div>
                )}

                {/* AI Detection Display */}
                {essay.ai_detection_report && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">AI Content Analysis</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`text-lg font-bold ${getAIProbabilityColor(essay.ai_detection_report.ai_probability)}`}>
                          {Math.round(essay.ai_detection_report.ai_probability * 100)}% AI
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {Math.round(essay.ai_detection_report.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${
                          essay.ai_detection_report.ai_probability >= 0.7 ? 'bg-red-500' :
                          essay.ai_detection_report.ai_probability >= 0.4 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.round(essay.ai_detection_report.ai_probability * 100)}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {essay.ai_detection_report.ai_probability >= 0.7 ? 
                        '⚠️ High probability of AI-generated content. Consider discussing with student.' :
                        essay.ai_detection_report.ai_probability >= 0.4 ?
                        '⚠️ Moderate probability of AI assistance. May require further review.' :
                        '✅ Low probability of AI generation. Likely human-written content.'
                      }
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {essay.file_url && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* ALWAYS show View Detailed Grade button if grade exists */}
                    {essay.grade && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewGrade(essay)}
                        className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Star className="w-4 h-4" />
                        <span>View Detailed Grade</span>
                      </Button>
                    )}
                    
                    {/* AI Detection Button */}
                    {!essay.ai_detection_report && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckAIContent(essay.id)}
                        loading={isLoading}
                        className="flex items-center space-x-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Brain className="w-4 h-4" />
                        <span>Check AI Content</span>
                      </Button>
                    )}
                    
                    {essay.ai_detection_report && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAIDetection(essay)}
                        className="flex items-center space-x-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Brain className="w-4 h-4" />
                        <span>View AI Analysis</span>
                      </Button>
                    )}
                    
                    {essay.plagiarism_report && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPlagiarism(essay)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Report
                      </Button>
                    )}
                    
                    {essay.status === 'submitted' && (
                      <>
                        {/* AI GRADING BUTTON */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAIGradeEssay(essay.id)}
                          loading={isLoading}
                          className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <Bot className="w-4 h-4" />
                          <span>AI Grade</span>
                        </Button>
                        
                        {/* MANUAL GRADING BUTTON */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGradeEssay(essay)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Manual Grade</span>
                        </Button>
                        
                        {!essay.plagiarism_report && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckPlagiarism(essay.id)}
                            loading={isLoading}
                          >
                            Check Plagiarism
                          </Button>
                        )}
                      </>
                    )}

                    {/* RE-GRADE BUTTON for already graded essays */}
                    {essay.grade && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGradeEssay(essay)}
                        className="flex items-center space-x-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Re-Grade</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No students have submitted essays for this assignment yet'
              }
            </p>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={viewMode === 'grade' && !!selectedEssay}
        onClose={() => {
          setSelectedEssay(null);
          setViewMode(null);
        }}
        title="📊 Detailed Grade Analysis"
        size="xl"
      >
        {selectedEssay?.grade && <EssayGradeDisplay grade={selectedEssay.grade} />}
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

      {/* Grading Modal - FIXED: Only render when both conditions are true */}
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
    </motion.div>
  );
};