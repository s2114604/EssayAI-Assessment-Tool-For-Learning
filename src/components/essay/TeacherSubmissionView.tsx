import React from 'react';
import { motion } from 'framer-motion';
import { FileText, User, Calendar, Award, Shield, Download, MessageSquare, CheckCircle, Star, Edit, Bot, AlertCircle, Brain } from 'lucide-react';
import { Essay } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TeacherSubmissionViewProps {
  essay: Essay;
  onGrade: (essay: Essay) => void;
  onAIGrade?: (essayId: string) => void;
  onCheckPlagiarism: (essayId: string) => void;
  onCheckAIContent?: (essayId: string) => void;
  onViewGrade?: (essay: Essay) => void;
  onViewPlagiarism?: (essay: Essay) => void;
  onViewAIDetection?: (essay: Essay) => void;
  isLoading: boolean;
}

export const TeacherSubmissionView: React.FC<TeacherSubmissionViewProps> = ({
  essay,
  onGrade,
  onAIGrade,
  onCheckPlagiarism,
  onCheckAIContent,
  onViewGrade,
  onViewPlagiarism,
  onViewAIDetection,
  isLoading,
}) => {
  // CRITICAL: Debug grade visibility for teachers
  console.log('🔍 === CRITICAL: TeacherSubmissionView Grade Debug ===');
  console.log('📝 Essay:', essay.title);
  console.log('👤 Student:', (essay as any).student?.full_name);
  console.log('📊 Has Grade:', !!essay.grade);
  console.log('📊 Grade Data:', essay.grade);
  console.log('📊 Status:', essay.status);
  console.log('🔍 Has AI Detection:', !!essay.ai_detection_report);
  
  if (essay.grade) {
    console.log('✅ GRADE FOUND - Should show View Grade button for teacher!');
    console.log('📊 Grade Details:', {
      totalScore: essay.grade.total_score,
      maxScore: essay.grade.max_score,
      gradedBy: essay.grade.graded_by,
      hasDetailedFeedback: !!essay.grade.detailed_feedback
    });
  } else {
    console.log('❌ NO GRADE FOUND - No View Grade button will show');
  }

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

  const isOverdue = essay.assignment && new Date(essay.assignment.due_date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">{essay.title}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(essay.status)}`}>
                {essay.status}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Late Submission
                </span>
              )}
            </div>
            
            {essay.assignment && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Assignment:</strong> {essay.assignment.title}
                </p>
                <p className="text-xs text-blue-600">
                  Due: {new Date(essay.assignment.due_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Student: {(essay as any).student?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Submitted: {new Date(essay.submitted_at).toLocaleDateString()}</span>
          </div>
          {essay.file_name && (
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{essay.file_name} ({essay.file_size ? (essay.file_size / 1024 / 1024).toFixed(2) : '0'} MB)</span>
            </div>
          )}
        </div>

        {essay.content && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Essay Content:</h4>
            <p className="text-sm text-gray-700 line-clamp-4">{essay.content}</p>
          </div>
        )}

        {/* 🎉 SUPER ENHANCED GRADE DISPLAY FOR TEACHERS 🎉 */}
        {essay.grade && (
          <div className="mb-6">
            {/* Main Grade Banner */}
            <div className="p-6 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl border-2 border-green-300 shadow-lg mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {essay.grade.graded_by === 'ai' ? (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-blue-800">🤖 AI Grading Complete!</h4>
                        <p className="text-sm text-blue-600">Comprehensive analysis with detailed feedback</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-green-800">👨‍🏫 Teacher Graded!</h4>
                        <p className="text-sm text-green-600">Manual grading with custom feedback</p>
                      </div>
                    </>
                  )}
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`text-5xl font-bold ${getGradeColor(essay.grade.total_score)}`}>
                    {getGradeLetter(essay.grade.total_score, essay.grade.max_score)}
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getGradeColor(essay.grade.total_score)}`}>
                      {essay.grade.total_score}/{essay.grade.max_score}
                    </div>
                    <div className="text-xl text-gray-600">
                      {Math.round((essay.grade.total_score / essay.grade.max_score) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Criteria Breakdown Preview */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                {Object.entries(essay.grade.criteria_scores).map(([key, score]) => (
                  <div key={key} className="text-center p-3 bg-white/80 rounded-lg border shadow-sm">
                    <div className={`text-lg font-bold ${getGradeColor(score)}`}>
                      {score}/20
                    </div>
                    <div className="text-xs text-gray-600 capitalize font-medium">
                      {key.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Feedback Preview */}
              {essay.grade.feedback && (
                <div className="bg-white/80 rounded-lg p-4 mb-4 border">
                  <h5 className="text-sm font-bold text-gray-900 mb-2">
                    {essay.grade.graded_by === 'ai' ? '🤖 AI Feedback Preview:' : '👨‍🏫 Teacher Feedback Preview:'}
                  </h5>
                  <p className="text-sm text-gray-700 line-clamp-3 italic">
                    "{essay.grade.feedback.substring(0, 200)}..."
                  </p>
                </div>
              )}
            </div>

            {/* 🌟 SUPER MEGA PROMINENT VIEW DETAILED GRADE BUTTON FOR TEACHERS 🌟 */}
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  console.log('🎯 CRITICAL: Teacher View Grade button clicked!');
                  console.log('📊 Essay with grade:', essay);
                  onViewGrade?.(essay);
                }}
                className="w-full bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                <div className="flex items-center justify-center space-x-4">
                  <Star className="w-8 h-8 animate-pulse" />
                  <div className="text-center">
                    <div className="text-2xl font-black">VIEW COMPLETE GRADE ANALYSIS</div>
                    <div className="text-sm opacity-90 mt-1">
                      See detailed breakdown, criterion scores & complete feedback
                    </div>
                  </div>
                  <Award className="w-8 h-8 animate-pulse" />
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* AI Detection Report Banner */}
        {essay.ai_detection_report && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900">AI Content Detection</h4>
                  <p className="text-xs text-purple-700">
                    {essay.ai_detection_report.ai_probability >= 0.7 ? 
                      'High probability of AI-generated content' :
                      essay.ai_detection_report.ai_probability >= 0.4 ?
                      'Moderate probability of AI-generated content' :
                      'Low probability of AI-generated content'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${getAIProbabilityColor(essay.ai_detection_report.ai_probability)}`}>
                  {Math.round(essay.ai_detection_report.ai_probability * 100)}%
                </span>
                <span className="text-sm text-gray-600">AI probability</span>
              </div>
            </div>
            
            {onViewAIDetection && (
              <div className="mt-2 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewAIDetection(essay)}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  View AI Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {essay.plagiarism_report && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Plagiarism Check: {essay.plagiarism_report.similarity_percentage}% similarity
              </span>
            </div>
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
            {/* 🎯 ALWAYS SHOW VIEW DETAILED GRADE BUTTON IF GRADE EXISTS 🎯 */}
            {essay.grade && onViewGrade && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  console.log('🎯 CRITICAL: Teacher secondary View Grade button clicked!');
                  console.log('📊 Essay with grade:', essay);
                  onViewGrade(essay);
                }}
                className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 font-bold shadow-lg"
              >
                <Star className="w-4 h-4" />
                <span>View Detailed Grade</span>
              </Button>
            )}
            
            {/* AI Detection Button */}
            {onCheckAIContent && !essay.ai_detection_report && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCheckAIContent(essay.id)}
                loading={isLoading}
                className="flex items-center space-x-1 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Brain className="w-4 h-4" />
                <span>Check AI Content</span>
              </Button>
            )}
            
            {essay.ai_detection_report && onViewAIDetection && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewAIDetection(essay)}
                className="flex items-center space-x-1 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Brain className="w-4 h-4" />
                <span>View AI Analysis</span>
              </Button>
            )}
            
            {essay.plagiarism_report && onViewPlagiarism && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewPlagiarism(essay)}
              >
                <Shield className="w-4 h-4 mr-1" />
                <span>View Report</span>
              </Button>
            )}
            
            {essay.status === 'submitted' && (
              <>
                {/* AI GRADING BUTTON */}
                {onAIGrade && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAIGrade(essay.id)}
                    loading={isLoading}
                    className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                  >
                    <Bot className="w-4 h-4" />
                    <span>🤖 AI Grade & Show Analysis</span>
                  </Button>
                )}
                
                {/* MANUAL GRADING BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGrade(essay)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Manual Grade</span>
                </Button>
                
                {!essay.plagiarism_report && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCheckPlagiarism(essay.id)}
                    loading={isLoading}
                  >
                    <Shield className="w-4 h-4 mr-1" />
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
                onClick={() => onGrade(essay)}
                className="flex items-center space-x-1 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Edit className="w-4 h-4" />
                <span>Re-Grade</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};