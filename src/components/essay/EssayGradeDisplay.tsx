import React from 'react';
import { motion } from 'framer-motion';
import { Award, MessageSquare, TrendingUp, Bot, User, AlertCircle, CheckCircle, XCircle, Minus, BookOpen, Target, Lightbulb } from 'lucide-react';
import { EssayGrade } from '../../types';
import { Card } from '../ui/Card';

interface EssayGradeDisplayProps {
  grade: EssayGrade;
}

export const EssayGradeDisplay: React.FC<EssayGradeDisplayProps> = ({ grade }) => {
  const criteriaLabels = {
    grammar: 'Grammar & Mechanics',
    cohesion: 'Cohesion & Coherence',
    sentence_structure: 'Sentence Structure',
    tone: 'Tone & Style',
    organization: 'Organization',
  };

  const getScoreColor = (score: number, maxScore: number = 20) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreIcon = (score: number, maxScore: number = 20) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return <CheckCircle className="w-4 h-4" />;
    if (percentage >= 70) return <Minus className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getOverallScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 80) return 'from-blue-500 to-blue-600';
    if (percentage >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
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

  const getPerformanceMessage = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 95) return 'Outstanding work! Exceptional quality across all criteria.';
    if (percentage >= 90) return 'Excellent work! Strong performance with minor areas for improvement.';
    if (percentage >= 85) return 'Very good work! Solid performance with some room for enhancement.';
    if (percentage >= 80) return 'Good work! Meets expectations with several areas to strengthen.';
    if (percentage >= 75) return 'Satisfactory work. Shows understanding but needs improvement.';
    if (percentage >= 70) return 'Acceptable work. Basic requirements met but significant improvement needed.';
    if (percentage >= 65) return 'Below expectations. Requires substantial revision and improvement.';
    return 'Needs significant work. Please review feedback carefully and consider resubmission.';
  };

  const calculatePointsDeducted = (score: number, maxScore: number) => {
    return maxScore - score;
  };

  const totalPointsDeducted = grade.max_score - grade.total_score;
  const percentage = (grade.total_score / grade.max_score) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Enhanced Header with Grade Type */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {grade.graded_by === 'ai' ? (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">🤖 AI Comprehensive Analysis</h2>
                  <p className="text-sm text-blue-700">Advanced linguistic evaluation with detailed criterion-specific feedback</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-900">👨‍🏫 Teacher Assessment</h2>
                  <p className="text-sm text-green-700">Professional evaluation with personalized feedback</p>
                </div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Graded on</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(grade.graded_at).toLocaleDateString()} at {new Date(grade.graded_at).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Score */}
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getOverallScoreColor(grade.total_score, grade.max_score)} flex items-center justify-center shadow-lg`}>
            <div className="text-white text-center">
              <div className="text-2xl font-bold">{grade.total_score}</div>
              <div className="text-xs opacity-90">/{grade.max_score}</div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-3xl font-bold text-gray-900">{getGradeLetter(grade.total_score, grade.max_score)}</div>
            <div className="text-lg text-gray-600">{percentage.toFixed(1)}%</div>
            <div className="flex items-center space-x-1 mt-1">
              {grade.graded_by === 'ai' ? (
                <>
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">AI Graded</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Teacher Graded</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Performance</h3>
        <p className="text-gray-600 mb-4">{getPerformanceMessage(grade.total_score, grade.max_score)}</p>
        
        {totalPointsDeducted > 0 && (
          <div className="inline-flex items-center space-x-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {totalPointsDeducted} point{totalPointsDeducted !== 1 ? 's' : ''} deducted from maximum score
            </span>
          </div>
        )}
      </Card>

      {/* ENHANCED Detailed Criteria Breakdown */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Detailed Score Breakdown</h3>
          <span className="text-sm text-gray-500">({Object.keys(grade.criteria_scores).length} criteria evaluated)</span>
        </div>
        
        <div className="space-y-6">
          {Object.entries(grade.criteria_scores).map(([key, score]) => {
            const maxScore = 20; // Default max score per criterion
            const pointsDeducted = calculatePointsDeducted(score, maxScore);
            const criteriaPercentage = (score / maxScore) * 100;
            
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg border-2 ${getScoreColor(score, maxScore)}`}>
                      {getScoreIcon(score, maxScore)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {criteriaLabels[key as keyof typeof criteriaLabels]}
                      </h4>
                      <p className="text-sm text-gray-600">{criteriaPercentage.toFixed(1)}% of maximum possible score</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(score, maxScore).split(' ')[0]}`}>
                      {score}/{maxScore}
                    </div>
                    {pointsDeducted > 0 && (
                      <div className="text-sm text-red-600 font-medium">
                        -{pointsDeducted} point{pointsDeducted !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${criteriaPercentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full rounded-full ${
                        criteriaPercentage >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        criteriaPercentage >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                        criteriaPercentage >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0</span>
                    <span className="font-medium">{score}</span>
                    <span>{maxScore}</span>
                  </div>
                </div>

                {/* ENHANCED Detailed Feedback for this criterion */}
                {grade.detailed_feedback && grade.detailed_feedback[key as keyof typeof grade.detailed_feedback] && (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h5 className="text-sm font-semibold text-blue-900">
                        {grade.graded_by === 'ai' ? 'AI Analysis:' : 'Teacher Feedback:'}
                      </h5>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {grade.detailed_feedback[key as keyof typeof grade.detailed_feedback]}
                    </div>
                  </div>
                )}

                {/* Performance indicators */}
                <div className="flex items-center justify-between mt-4 text-xs">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      criteriaPercentage >= 90 ? 'bg-green-100 text-green-800' :
                      criteriaPercentage >= 80 ? 'bg-blue-100 text-blue-800' :
                      criteriaPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {criteriaPercentage >= 90 ? 'Excellent' :
                       criteriaPercentage >= 80 ? 'Good' :
                       criteriaPercentage >= 70 ? 'Satisfactory' :
                       'Needs Improvement'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Target: 16+ points</span>
                    </div>
                  </div>
                  {pointsDeducted > 0 && (
                    <span className="text-red-600 font-medium">
                      Points lost: {pointsDeducted}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary of Deductions */}
        {totalPointsDeducted > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-2">Points Deduction Summary</h4>
            <div className="space-y-1">
              {Object.entries(grade.criteria_scores).map(([key, score]) => {
                const pointsLost = 20 - score; // Assuming 20 is max per criterion
                if (pointsLost > 0) {
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-red-700">
                        {criteriaLabels[key as keyof typeof criteriaLabels]}:
                      </span>
                      <span className="font-medium text-red-800">
                        -{pointsLost} point{pointsLost !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                }
                return null;
              }).filter(Boolean)}
              <div className="border-t border-red-300 pt-2 mt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-red-900">Total Points Deducted:</span>
                  <span className="text-red-900">-{totalPointsDeducted} points</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ENHANCED Overall Feedback */}
      {grade.feedback && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {grade.graded_by === 'ai' ? 'Comprehensive AI Feedback & Analysis' : 'Teacher Feedback'}
            </h3>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">{grade.feedback}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {grade.graded_by === 'ai' ? (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Generated by Advanced AI Analysis</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Written by Teacher</span>
                </>
              )}
            </div>
            <span>
              Analysis completed on {new Date(grade.graded_at).toLocaleDateString()} at {new Date(grade.graded_at).toLocaleTimeString()}
            </span>
          </div>
        </Card>
      )}

      {/* ENHANCED Grade Distribution Visualization */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Score Distribution Analysis</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(grade.criteria_scores).map(([key, score]) => {
            const maxScore = 20;
            const percentage = (score / maxScore) * 100;
            return (
              <div key={key} className="flex items-center space-x-4">
                <div className="w-40 text-sm text-gray-700 font-medium">
                  {criteriaLabels[key as keyof typeof criteriaLabels]}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      percentage >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                      percentage >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      percentage >= 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                  />
                </div>
                <div className="w-20 text-sm font-bold text-gray-900 text-right">
                  {score}/{maxScore}
                </div>
                <div className="w-16 text-xs text-gray-600 text-right">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall Performance Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Performance Summary</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600">
                {Object.values(grade.criteria_scores).filter(score => score >= 18).length}
              </div>
              <div className="text-gray-600">Excellent (18-20)</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600">
                {Object.values(grade.criteria_scores).filter(score => score >= 16 && score < 18).length}
              </div>
              <div className="text-gray-600">Good (16-17)</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">
                {Object.values(grade.criteria_scores).filter(score => score >= 14 && score < 16).length}
              </div>
              <div className="text-gray-600">Fair (14-15)</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">
                {Object.values(grade.criteria_scores).filter(score => score < 14).length}
              </div>
              <div className="text-gray-600">Needs Work (&lt;14)</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};