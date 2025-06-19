import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Award, Edit, Trash2, Upload, Eye, Clock, Bot, User, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { Essay } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface StudentSubmissionCardProps {
  essay: Essay;
  onEdit: (essay: Essay) => void;
  onDelete: (essayId: string) => void;
  onReupload: (essay: Essay) => void;
  onView?: (essay: Essay) => void;
  showAssignmentInfo?: boolean;
}

export const StudentSubmissionCard: React.FC<StudentSubmissionCardProps> = ({
  essay,
  onEdit,
  onDelete,
  onReupload,
  onView,
  showAssignmentInfo = true,
}) => {
  // CRITICAL: Debug grade visibility
  console.log('🔍 === CRITICAL: StudentSubmissionCard Grade Debug ===');
  console.log('📝 Essay:', essay.title);
  console.log('📊 Has Grade:', !!essay.grade);
  console.log('📊 Grade Data:', essay.grade);
  console.log('📊 Status:', essay.status);
  
  if (essay.grade) {
    console.log('✅ GRADE FOUND - Should show View Grade button!');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'grading': return <Clock className="w-4 h-4 animate-spin" />;
      case 'graded': return <CheckCircle className="w-4 h-4" />;
      case 'returned': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  const isOverdue = essay.assignment && new Date(essay.assignment.due_date) < new Date();
  const canEdit = essay.status === 'submitted' || essay.status === 'returned';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">{essay.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(essay.status)}`}>
                {getStatusIcon(essay.status)}
                <span className="ml-1 capitalize">{essay.status}</span>
              </span>
            </div>
            
            {showAssignmentInfo && essay.assignment && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Assignment:</strong> {essay.assignment.title}
                </p>
                <p className="text-xs text-blue-600">
                  Due: {new Date(essay.assignment.due_date).toLocaleDateString()}
                  {isOverdue && <span className="text-red-600 ml-2">(Overdue)</span>}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-3 line-clamp-2">{essay.content}</p>
          </div>
        </div>

        {/* 🎉 SUPER ENHANCED GRADE DISPLAY - ALWAYS VISIBLE WHEN GRADE EXISTS 🎉 */}
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
                        <h4 className="text-xl font-bold text-blue-800">🤖 AI Analysis Complete!</h4>
                        <p className="text-sm text-blue-600">Comprehensive grading with detailed feedback</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-green-800">👨‍🏫 Teacher Graded!</h4>
                        <p className="text-sm text-green-600">Manual grading with personalized feedback</p>
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
              
              {/* Criteria Breakdown */}
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

            {/* 🌟 SUPER MEGA PROMINENT VIEW DETAILED GRADE BUTTON 🌟 */}
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  console.log('🎯 CRITICAL: View Grade button clicked!');
                  console.log('📊 Essay with grade:', essay);
                  onView?.(essay);
                }}
                className="w-full bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                <div className="flex items-center justify-center space-x-4">
                  <Star className="w-8 h-8 animate-pulse" />
                  <div className="text-center">
                    <div className="text-2xl font-black">VIEW COMPLETE GRADE ANALYSIS</div>
                    <div className="text-sm opacity-90 mt-1">
                      See detailed breakdown, criterion scores & complete AI feedback
                    </div>
                  </div>
                  <Award className="w-8 h-8 animate-pulse" />
                </div>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Submitted: {new Date(essay.submitted_at).toLocaleDateString()}</span>
          </div>
          {essay.file_name && (
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{essay.file_name}</span>
            </div>
          )}
          {essay.plagiarism_report && (
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
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

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(essay.updated_at || essay.submitted_at).toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 🎯 ALWAYS SHOW VIEW GRADE BUTTON IF GRADE EXISTS 🎯 */}
            {essay.grade && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  console.log('🎯 CRITICAL: Secondary View Grade button clicked!');
                  console.log('📊 Essay with grade:', essay);
                  onView?.(essay);
                }}
                className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 font-bold shadow-lg"
              >
                <Award className="w-4 h-4" />
                <span>View Grade Details</span>
              </Button>
            )}
            
            {!essay.grade && essay.status === 'submitted' && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">Waiting for grading</span>
              </div>
            )}
            
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(essay)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReupload(essay)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Reupload
                </Button>
              </>
            )}
            
            {essay.status === 'submitted' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(essay.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};