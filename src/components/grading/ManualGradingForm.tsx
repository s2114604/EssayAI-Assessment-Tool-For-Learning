import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, MessageSquare, Save, X, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { EssayGrade } from '../../types';

interface ManualGradingFormProps {
  essayId: string;
  essayTitle: string;
  essayContent: string;
  existingGrade?: EssayGrade;
  onSubmit: (gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const ManualGradingForm: React.FC<ManualGradingFormProps> = ({
  essayId,
  essayTitle,
  essayContent,
  existingGrade,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [scores, setScores] = useState({
    grammar: existingGrade?.criteria_scores.grammar || 15,
    cohesion: existingGrade?.criteria_scores.cohesion || 15,
    sentence_structure: existingGrade?.criteria_scores.sentence_structure || 15,
    tone: existingGrade?.criteria_scores.tone || 15,
    organization: existingGrade?.criteria_scores.organization || 15,
  });

  const [feedback, setFeedback] = useState(existingGrade?.feedback || '');
  
  // Detailed feedback for each criterion
  const [detailedFeedback, setDetailedFeedback] = useState({
    grammar: existingGrade?.detailed_feedback?.grammar || '',
    cohesion: existingGrade?.detailed_feedback?.cohesion || '',
    sentence_structure: existingGrade?.detailed_feedback?.sentence_structure || '',
    tone: existingGrade?.detailed_feedback?.tone || '',
    organization: existingGrade?.detailed_feedback?.organization || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxPossibleScore = 100;

  const handleScoreChange = (criterion: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const maxScore = 20;
    
    if (numValue < 0 || numValue > maxScore) {
      setErrors(prev => ({
        ...prev,
        [criterion]: `Score must be between 0 and ${maxScore}`
      }));
      return;
    }

    setErrors(prev => ({ ...prev, [criterion]: '' }));
    setScores(prev => ({ ...prev, [criterion]: numValue }));
  };

  const handleDetailedFeedbackChange = (criterion: string, value: string) => {
    setDetailedFeedback(prev => ({ ...prev, [criterion]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!feedback.trim()) {
      newErrors.feedback = 'Overall feedback is required';
    }

    if (totalScore === 0) {
      newErrors.total = 'Please assign scores for at least one criterion';
    }

    // Check if detailed feedback is provided for each criterion
    Object.entries(detailedFeedback).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[`detailed_${key}`] = 'Detailed feedback is required for this criterion';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Get current user from localStorage
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

      const gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'> = {
        essay_id: essayId,
        total_score: totalScore,
        max_score: maxPossibleScore,
        criteria_scores: {
          grammar: scores.grammar,
          cohesion: scores.cohesion,
          sentence_structure: scores.sentence_structure,
          tone: scores.tone,
          organization: scores.organization,
        },
        feedback: `Manual Grading Complete for "${essayTitle}"

Final Score: ${totalScore}/100 (${Math.round((totalScore/100)*100)}%)

Overall Assessment:
${feedback}

Detailed Criterion Analysis:
- Grammar & Mechanics (${scores.grammar}/20): ${detailedFeedback.grammar}
- Cohesion & Coherence (${scores.cohesion}/20): ${detailedFeedback.cohesion}
- Sentence Structure (${scores.sentence_structure}/20): ${detailedFeedback.sentence_structure}
- Tone & Style (${scores.tone}/20): ${detailedFeedback.tone}
- Organization (${scores.organization}/20): ${detailedFeedback.organization}

This essay was manually graded by your teacher with detailed feedback for each criterion.`,
        detailed_feedback: {
          grammar: detailedFeedback.grammar,
          cohesion: detailedFeedback.cohesion,
          sentence_structure: detailedFeedback.sentence_structure,
          tone: detailedFeedback.tone,
          organization: detailedFeedback.organization,
        },
        graded_by: 'teacher',
        teacher_id: currentUserId,
        graded_at: new Date().toISOString(),
      };

      console.log('📝 Submitting manual grade with detailed feedback:', gradeData);
      await onSubmit(gradeData);
    } catch (error) {
      console.error('Error submitting manual grade:', error);
    }
  };

  const getScoreColor = (score: number, maxScore: number = 20) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 border-green-300 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 border-blue-300 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 border-yellow-300 bg-yellow-50';
    return 'text-red-600 border-red-300 bg-red-50';
  };

  const getTotalScoreColor = () => {
    const percentage = (totalScore / maxPossibleScore) * 100;
    if (percentage >= 90) return 'from-green-500 to-green-600';
    if (percentage >= 80) return 'from-blue-500 to-blue-600';
    if (percentage >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const criteriaLabels = {
    grammar: 'Grammar & Mechanics',
    cohesion: 'Cohesion & Coherence',
    sentence_structure: 'Sentence Structure',
    tone: 'Tone & Style',
    organization: 'Organization',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Essay Preview */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{essayTitle}</h3>
        <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">{essayContent}</p>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Word count: {essayContent.split(/\s+/).length} words
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scoring Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Manual Scoring & Detailed Feedback</h3>
          </div>

          <div className="space-y-6">
            {Object.entries(criteriaLabels).map(([key, label]) => {
              const currentScore = scores[key as keyof typeof scores];
              const currentFeedback = detailedFeedback[key as keyof typeof detailedFeedback];
              
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {label}
                      </label>
                      <div className="text-xs text-gray-500">
                        Score out of 20 points
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {currentScore}/20
                      </div>
                    </div>
                  </div>
                  
                  {/* Score Input */}
                  <div className="mb-4">
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={currentScore}
                      onChange={(e) => handleScoreChange(key, e.target.value)}
                      error={errors[key]}
                      className={`text-center ${currentScore > 0 ? getScoreColor(currentScore, 20) : ''}`}
                    />
                  </div>

                  {/* Detailed Feedback for this criterion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Feedback for {label} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={currentFeedback}
                      onChange={(e) => handleDetailedFeedbackChange(key, e.target.value)}
                      placeholder={`Provide specific feedback for ${label.toLowerCase()}...`}
                      rows={3}
                      error={errors[`detailed_${key}`]}
                      required
                    />
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (currentScore / 20) * 100 >= 90 ? 'bg-green-500' :
                        (currentScore / 20) * 100 >= 80 ? 'bg-blue-500' :
                        (currentScore / 20) * 100 >= 70 ? 'bg-yellow-500' :
                        currentScore > 0 ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.max((currentScore / 20) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Score Display */}
          <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getTotalScoreColor()} flex items-center justify-center shadow-lg`}>
                  <div className="text-white text-center">
                    <div className="text-lg font-bold">{totalScore}</div>
                    <div className="text-xs opacity-90">/100</div>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">Total Score</span>
                  <div className="text-sm text-gray-600">
                    {((totalScore / maxPossibleScore) * 100).toFixed(1)}% of maximum
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${getTotalScoreColor()}`}
                style={{ width: `${Math.min((totalScore / maxPossibleScore) * 100, 100)}%` }}
              />
            </div>
            
            {errors.total && <p className="mt-2 text-sm text-red-600">{errors.total}</p>}
          </div>
        </Card>

        {/* Overall Feedback Section */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Overall Assessment</h3>
          </div>

          <Textarea
            label="Overall Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide comprehensive overall feedback about the essay's strengths, weaknesses, and suggestions for improvement..."
            rows={6}
            error={errors.feedback}
            required
          />
          
          <div className="mt-2 text-xs text-gray-500">
            This will be combined with your detailed criterion feedback to create a comprehensive grade report.
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {existingGrade ? 'Update Grade' : 'Save Grade'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};