import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';

// Default rubric
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

interface RubricCustomizerProps {
  rubric: any;
  onSave: (rubric: any) => void;
  onCancel: () => void;
}

export const RubricCustomizer: React.FC<RubricCustomizerProps> = ({
  rubric = DEFAULT_RUBRIC,
  onSave,
  onCancel,
}) => {
  const [editedRubric, setEditedRubric] = useState({ ...rubric });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateRubricField = (field: string, value: any) => {
    setEditedRubric(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateCriterion = (key: string, field: 'weight' | 'description', value: any) => {
    setEditedRubric(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: {
          ...prev.criteria[key],
          [field]: value
        }
      }
    }));
  };

  const addCustomCriterion = () => {
    const newKey = `custom_${Date.now()}`;
    setEditedRubric(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [newKey]: {
          weight: 10,
          description: 'New Custom Criterion'
        }
      }
    }));
  };

  const removeCriterion = (key: string) => {
    const { [key]: removed, ...remainingCriteria } = editedRubric.criteria;
    setEditedRubric(prev => ({
      ...prev,
      criteria: remainingCriteria
    }));
  };

  const resetToDefault = () => {
    setEditedRubric({ ...DEFAULT_RUBRIC });
    setErrors({});
  };

  const validateRubric = () => {
    const newErrors: Record<string, string> = {};

    if (!editedRubric.name.trim()) {
      newErrors.name = 'Rubric name is required';
    }

    if (editedRubric.max_score <= 0) {
      newErrors.max_score = 'Maximum score must be greater than 0';
    }

    const totalWeight = Object.values(editedRubric.criteria).reduce(
      (sum: number, criterion: any) => sum + criterion.weight, 0
    );

    if (totalWeight !== editedRubric.max_score) {
      newErrors.total_weight = `Total criteria weights (${totalWeight}) must equal maximum score (${editedRubric.max_score})`;
    }

    Object.entries(editedRubric.criteria).forEach(([key, criterion]: [string, any]) => {
      if (!criterion.description.trim()) {
        newErrors[`${key}_description`] = 'Description is required';
      }
      if (criterion.weight <= 0) {
        newErrors[`${key}_weight`] = 'Weight must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateRubric()) {
      onSave(editedRubric);
    }
  };

  const totalWeight = Object.values(editedRubric.criteria).reduce(
    (sum: number, criterion: any) => sum + criterion.weight, 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Rubric Info */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Rubric Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Rubric Name"
            value={editedRubric.name}
            onChange={(e) => updateRubricField('name', e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Maximum Score"
            type="number"
            min="1"
            value={editedRubric.max_score}
            onChange={(e) => updateRubricField('max_score', parseInt(e.target.value) || 0)}
            error={errors.max_score}
            required
          />
        </div>

        <Textarea
          label="Description (Optional)"
          value={editedRubric.description || ''}
          onChange={(e) => updateRubricField('description', e.target.value)}
          placeholder="Describe the purpose and context of this rubric..."
          rows={2}
          className="mt-4"
        />
      </Card>

      {/* Criteria Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Grading Criteria</h3>
          <Button variant="outline" size="sm" onClick={addCustomCriterion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Criterion
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(editedRubric.criteria).map(([key, criterion]: [string, any]) => (
            <div key={key} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Description"
                      value={criterion.description}
                      onChange={(e) => updateCriterion(key, 'description', e.target.value)}
                      error={errors[`${key}_description`]}
                      placeholder="Describe what this criterion evaluates..."
                    />
                  </div>
                  <Input
                    label="Weight (Points)"
                    type="number"
                    min="1"
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(key, 'weight', parseInt(e.target.value) || 0)}
                    error={errors[`${key}_weight`]}
                  />
                </div>
                {!['grammar', 'cohesion', 'sentence_variety', 'tone', 'structure'].includes(key) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCriterion(key)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Weight Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Weight:</span>
            <span className={`text-lg font-bold ${
              totalWeight === editedRubric.max_score ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalWeight} / {editedRubric.max_score}
            </span>
          </div>
          {errors.total_weight && (
            <p className="mt-1 text-sm text-red-600">{errors.total_weight}</p>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Rubric
          </Button>
        </div>
      </div>
    </motion.div>
  );
};