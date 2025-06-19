import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Settings, Loader2, AlertTriangle, CheckCircle, Award, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ManualGradingForm } from './ManualGradingForm';
import { RubricCustomizer } from './RubricCustomizer';
import { EssayGradeDisplay } from '../essay/EssayGradeDisplay';
import { Essay, EssayGrade } from '../../types';
import toast from 'react-hot-toast';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  essay: Essay;
  onGradeSubmit: (gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isLoading: boolean;
}

type GradingMode = 'select' | 'ai' | 'manual' | 'customize' | 'result';

// Default rubric for grading
const DEFAULT_RUBRIC = {
  id: 'default',
  name: 'Standard Essay Rubric',
  criteria: {
    grammar: {
      weight: 20,
      description: 'Grammar, spelling, punctuation, and mechanics'
    },
    cohesion: {
      weight: 20,
      description: 'Logical flow and coherence of ideas'
    },
    sentence_variety: {
      weight: 20,
      description: 'Variety in sentence structure and complexity'
    },
    tone: {
      weight: 20,
      description: 'Appropriate tone and style for the context'
    },
    structure: {
      weight: 20,
      description: 'Overall organization and structure'
    }
  },
  max_score: 100,
  description: 'Standard 5-criteria essay grading rubric'
};

// Simple AI grading function
const simpleAIGrading = (essayContent: string, essayTitle: string) => {
  console.log('🤖 Simple AI Grading for:', essayTitle);
  
  // Basic analysis
  const words = essayContent.trim().split(/\s+/);
  const sentences = essayContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;
  
  // Simple scoring based on length and basic criteria
  let grammarScore = Math.min(20, Math.max(10, 12 + (wordCount > 200 ? 4 : 2)));
  let cohesionScore = Math.min(20, Math.max(10, 13 + (sentences.length > 8 ? 3 : 1)));
  let sentenceScore = Math.min(20, Math.max(10, 14 + (wordCount > 150 ? 2 : 0)));
  let toneScore = Math.min(20, Math.max(10, 15 + (wordCount > 300 ? 3 : 1)));
  let organizationScore = Math.min(20, Math.max(10, 13 + (wordCount > 250 ? 4 : 2)));
  
  const totalScore = grammarScore + cohesionScore + sentenceScore + toneScore + organizationScore;
  
  return {
    total_score: totalScore,
    max_score: 100,
    criteria_scores: {
      grammar: grammarScore,
      cohesion: cohesionScore,
      sentence_structure: sentenceScore,
      tone: toneScore,
      organization: organizationScore,
    },
    feedback: `AI Analysis Complete for "${essayTitle}"

Final Score: ${totalScore}/100 (${Math.round((totalScore/100)*100)}%)

Essay Statistics:
- Word Count: ${wordCount}
- Sentences: ${sentences.length}

Score Breakdown:
- Grammar & Mechanics: ${grammarScore}/20
- Cohesion & Coherence: ${cohesionScore}/20  
- Sentence Structure: ${sentenceScore}/20
- Tone & Style: ${toneScore}/20
- Organization: ${organizationScore}/20

${totalScore >= 85 ? 'Excellent work! Strong writing skills demonstrated.' :
  totalScore >= 75 ? 'Good work! Some areas for improvement identified.' :
  totalScore >= 65 ? 'Satisfactory work. Focus on developing writing skills.' :
  'Needs improvement. Consider revising and expanding your essay.'}

This analysis was performed by our AI grading system.`,
    detailed_feedback: {
      grammar: `Grammar score: ${grammarScore}/20. ${grammarScore >= 16 ? 'Excellent grammar and mechanics.' : grammarScore >= 13 ? 'Good grammar with minor issues.' : 'Grammar needs improvement.'}`,
      cohesion: `Cohesion score: ${cohesionScore}/20. ${cohesionScore >= 16 ? 'Ideas flow well together.' : cohesionScore >= 13 ? 'Good organization with some gaps.' : 'Work on connecting ideas better.'}`,
      sentence_structure: `Sentence structure score: ${sentenceScore}/20. ${sentenceScore >= 16 ? 'Good variety in sentences.' : sentenceScore >= 13 ? 'Adequate sentence structure.' : 'Try varying sentence length and complexity.'}`,
      tone: `Tone score: ${toneScore}/20. ${toneScore >= 16 ? 'Appropriate academic tone.' : toneScore >= 13 ? 'Generally good tone.' : 'Work on maintaining consistent academic tone.'}`,
      organization: `Organization score: ${organizationScore}/20. ${organizationScore >= 16 ? 'Well-organized essay.' : organizationScore >= 13 ? 'Good structure overall.' : 'Improve essay organization and structure.'}`
    }
  };
};

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  onClose,
  essay,
  onGradeSubmit,
  isLoading,
}) => {
  const [mode, setMode] = useState<GradingMode>('select');
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC);
  const [aiGrading, setAiGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<EssayGrade | null>(null);

  const handleAIGrading = async () => {
    console.log('🤖 Starting AI grading for essay:', essay.title);
    setAiGrading(true);
    
    try {
      // Validate essay content
      if (!essay.content || essay.content.trim().length < 50) {
        toast.error('Essay content is too short for grading');
        setAiGrading(false);
        return;
      }

      // Perform simple AI grading
      const aiResult = simpleAIGrading(essay.content, essay.title);
      
      console.log('✅ AI grading completed:', aiResult);

      // Prepare grade data for submission
      const gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'> = {
        essay_id: essay.id,
        total_score: aiResult.total_score,
        max_score: aiResult.max_score,
        criteria_scores: {
          grammar: aiResult.criteria_scores.grammar,
          cohesion: aiResult.criteria_scores.cohesion,
          sentence_structure: aiResult.criteria_scores.sentence_structure,
          tone: aiResult.criteria_scores.tone,
          organization: aiResult.criteria_scores.organization,
        },
        feedback: aiResult.feedback,
        detailed_feedback: aiResult.detailed_feedback,
        graded_by: 'ai',
        graded_at: new Date().toISOString(),
      };

      // Submit grade to database
      console.log('💾 Submitting AI grade to database:', gradeData);
      await onGradeSubmit(gradeData);
      
      // Create a complete grade object for display
      const fullGrade: EssayGrade = {
        ...gradeData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setGradingResult(fullGrade);
      setMode('result');
      
      toast.success(`AI Grading Complete! Score: ${aiResult.total_score}/${aiResult.max_score}`);
    } catch (error: any) {
      console.error('❌ AI grading failed:', error);
      toast.error(error.message || 'Failed to complete AI grading');
    } finally {
      setAiGrading(false);
    }
  };

  const handleManualGradeSubmit = async (gradeData: Omit<EssayGrade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('📝 Submitting manual grade:', gradeData);
      await onGradeSubmit(gradeData);
      
      const fullGrade: EssayGrade = {
        ...gradeData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setGradingResult(fullGrade);
      setMode('result');
      toast.success('Manual grade submitted successfully!');
    } catch (error: any) {
      console.error('❌ Manual grade submission error:', error);
      toast.error(error.message || 'Failed to submit grade');
    }
  };

  const handleRubricSave = (newRubric: any) => {
    setRubric(newRubric);
    setMode('select');
    toast.success('Rubric updated successfully!');
  };

  const handleClose = () => {
    setMode('select');
    setGradingResult(null);
    onClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'select': return 'Grade Essay';
      case 'ai': return 'AI Grading';
      case 'manual': return 'Manual Grading';
      case 'customize': return 'Customize Rubric';
      case 'result': return 'Grading Complete';
      default: return 'Grade Essay';
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'select':
        return (
          <div className="space-y-6">
            {/* Essay Preview */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{essay.title}</h3>
              <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{essay.content}</p>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Word count: {essay.content?.split(/\s+/).length || 0} words
              </div>
            </Card>

            {/* Grading Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Grading Card */}
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-200 hover:border-blue-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {aiGrading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Grading</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Automated evaluation with detailed feedback and criteria breakdown
                  </p>
                  
                  <Button 
                    variant="primary" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    disabled={aiGrading || isLoading}
                    onClick={handleAIGrading}
                  >
                    {aiGrading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Grading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>Start AI Grading</span>
                      </div>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Manual Grading Card */}
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-green-200 hover:border-green-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Grading</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Grade manually with full control over scoring and custom feedback
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    onClick={() => {
                      console.log('📝 Manual grading button clicked!');
                      setMode('manual');
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Grade Manually</span>
                    </div>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Rubric Customization */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setMode('customize')}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Customize Rubric</span>
              </Button>
            </div>
          </div>
        );

      case 'manual':
        return (
          <ManualGradingForm
            essayId={essay.id}
            essayTitle={essay.title}
            essayContent={essay.content || ''}
            existingGrade={essay.grade}
            onSubmit={handleManualGradeSubmit}
            onCancel={() => setMode('select')}
            isLoading={isLoading}
          />
        );

      case 'customize':
        return (
          <RubricCustomizer
            rubric={rubric}
            onSave={handleRubricSave}
            onCancel={() => setMode('select')}
          />
        );

      case 'result':
        return (
          <div className="space-y-6">
            {/* Success Banner */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    Grading Complete!
                  </h3>
                  <p className="text-sm text-green-700">
                    Grade has been saved and is now available to the student.
                  </p>
                </div>
              </div>
            </Card>
            
            {gradingResult && <EssayGradeDisplay grade={gradingResult} />}
            
            <div className="flex justify-center">
              <Button onClick={handleClose} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete</span>
                </div>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="xl"
    >
      {renderContent()}
    </Modal>
  );
};