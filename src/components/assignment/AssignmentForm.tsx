import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Assignment } from '../../types';
import toast from 'react-hot-toast';

interface AssignmentFormProps {
  assignment?: Assignment | null;
  onSubmit: (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isLoading: boolean;
  teacherId: string;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  assignment,
  onSubmit,
  onCancel,
  isLoading,
  teacherId,
}) => {
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    instructions: assignment?.instructions || '',
    due_date: assignment?.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
    max_score: assignment?.max_score || 100,
    is_active: assignment?.is_active ?? true,
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['.docx', '.pdf', '.txt'];
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Please upload a .docx, .pdf, or .txt file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    toast.success('File uploaded successfully');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Assignment description is required';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due_date);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.due_date = 'Due date must be in the future';
      }
    }

    if (formData.max_score <= 0) {
      newErrors.max_score = 'Maximum score must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assignmentData = {
      ...formData,
      teacher_id: teacherId,
      due_date: new Date(formData.due_date).toISOString(),
      file_name: file?.name,
      file_size: file?.size,
      // In a real app, you would upload the file to storage and get the URL
      file_url: file ? `uploads/${file.name}` : assignment?.file_url,
    };

    onSubmit(assignmentData);
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <BookOpen className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          {assignment ? 'Edit Assignment' : 'Create New Assignment'}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Assignment Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter assignment title"
            error={errors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>}
          </div>
        </div>

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Provide a clear description of the assignment"
          rows={3}
          error={errors.description}
          required
        />

        <Textarea
          label="Instructions (Optional)"
          value={formData.instructions}
          onChange={(e) => handleChange('instructions', e.target.value)}
          placeholder="Detailed instructions for students on how to complete this assignment"
          rows={4}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment File (Optional)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".docx,.pdf,.txt"
                onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
              />
              
              {file || assignment?.file_name ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {file?.name || assignment?.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file ? (file.size / 1024 / 1024).toFixed(2) : assignment?.file_size ? (assignment.file_size / 1024 / 1024).toFixed(2) : '0'} MB
                    </p>
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Drag and drop your file here, or{' '}
                    <span className="text-primary-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports .docx, .pdf, .txt files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Settings */}
          <div className="space-y-4">
            <Input
              label="Maximum Score"
              type="number"
              value={formData.max_score}
              onChange={(e) => handleChange('max_score', parseInt(e.target.value) || 0)}
              min="1"
              max="1000"
              error={errors.max_score}
              required
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Assignment is active and visible to students
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {assignment ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </Card>
  );
};