import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, Users, Clock, Download, Edit, Trash2, Eye, Award, Bot, User, CheckCircle, Star } from 'lucide-react';
import { Assignment } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AssignmentCardProps {
  assignment: Assignment;
  userRole: 'teacher' | 'student' | 'super_admin';
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  onViewSubmissions?: (assignment: Assignment) => void;
  onSubmitEssay?: (assignment: Assignment) => void;
  submissionCount?: number;
  hasSubmitted?: boolean;
  userSubmission?: any; // The user's submission for this assignment
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  userRole,
  onEdit,
  onDelete,
  onViewSubmissions,
  onSubmitEssay,
  submissionCount = 0,
  hasSubmitted = false,
  userSubmission,
}) => {
  const isOverdue = new Date(assignment.due_date) < new Date();
  const daysUntilDue = Math.ceil((new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-100';
    if (daysUntilDue <= 1) return 'text-orange-600 bg-orange-100';
    if (daysUntilDue <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = () => {
    if (isOverdue) return 'Overdue';
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `${daysUntilDue} days left`;
  };

  const getSubmissionStatusColor = (status: string) => {
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

  // Function to handle viewing detailed grade
  const handleViewDetailedGrade = () => {
    if (userSubmission?.grade) {
      console.log('🎯 Opening detailed grade view for:', userSubmission.title);
      // Create a custom event to trigger grade viewing
      const event = new CustomEvent('viewDetailedGrade', {
        detail: { essay: userSubmission }
      });
      window.dispatchEvent(event);
    }
  };

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
              <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
              {!assignment.is_active && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
          </div>
          
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{new Date(assignment.due_date).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Max Score: {assignment.max_score}</span>
          </div>
          {userRole === 'teacher' && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {assignment.instructions && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> {assignment.instructions}
            </p>
          </div>
        )}

        {assignment.file_name && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{assignment.file_name}</span>
                <span className="text-xs text-gray-500">
                  ({assignment.file_size ? (assignment.file_size / 1024 / 1024).toFixed(2) : '0'} MB)
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ENHANCED Student submission status with PROMINENT grade display */}
        {userRole === 'student' && userSubmission && (
          <div className="mb-4">
            {/* Main submission status */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Your Submission:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubmissionStatusColor(userSubmission.status)}`}>
                    {userSubmission.status}
                  </span>
                  {userSubmission.grade && (
                    <div className="flex items-center space-x-1">
                      {userSubmission.grade.graded_by === 'ai' ? (
                        <Bot className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-xs text-gray-600">
                        {userSubmission.grade.graded_by === 'ai' ? 'AI Graded' : 'Teacher Graded'}
                      </span>
                    </div>
                  )}
                </div>
                {userSubmission.grade && (
                  <div className="flex items-center space-x-3">
                    <div className={`text-3xl font-bold ${getGradeColor(userSubmission.grade.total_score)}`}>
                      {getGradeLetter(userSubmission.grade.total_score, userSubmission.grade.max_score)}
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getGradeColor(userSubmission.grade.total_score)}`}>
                        {userSubmission.grade.total_score}/{userSubmission.grade.max_score}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round((userSubmission.grade.total_score / userSubmission.grade.max_score) * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-green-700 mb-3">{userSubmission.title}</p>
              
              {/* AI Grade Breakdown Preview */}
              {userSubmission.grade && (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(userSubmission.grade.criteria_scores).map(([key, score]) => (
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
                  
                  {userSubmission.grade.feedback && (
                    <div className="bg-white/70 rounded-lg p-3">
                      <p className="text-xs text-gray-700 line-clamp-2">
                        <strong>AI Feedback Preview:</strong> {userSubmission.grade.feedback.substring(0, 120)}...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SUPER PROMINENT VIEW DETAILED GRADE BUTTON */}
            {userSubmission.grade && (
              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleViewDetailedGrade}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Star className="w-5 h-5" />
                    <span className="text-lg">View Detailed Grade Analysis</span>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    See complete AI feedback, scores & improvement suggestions
                  </div>
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Created by {assignment.teacher?.full_name || 'Teacher'}
          </div>
          
          <div className="flex items-center space-x-2">
            {userRole === 'student' && (
              <>
                {hasSubmitted ? (
                  <div className="flex items-center space-x-2">
                    {userSubmission?.grade ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Graded & Ready to View</span>
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleViewDetailedGrade}
                          className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          <Award className="w-4 h-4" />
                          <span>View Grade</span>
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-blue-600 font-medium">✓ Submitted - Awaiting Grade</span>
                    )}
                  </div>
                ) : assignment.is_active && !isOverdue ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSubmitEssay?.(assignment)}
                  >
                    Submit Essay
                  </Button>
                ) : (
                  <span className="text-sm text-gray-500">
                    {isOverdue ? 'Overdue' : 'Inactive'}
                  </span>
                )}
              </>
            )}
            
            {userRole === 'teacher' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewSubmissions?.(assignment)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Submissions</span>
                  {submissionCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {submissionCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(assignment)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(assignment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};