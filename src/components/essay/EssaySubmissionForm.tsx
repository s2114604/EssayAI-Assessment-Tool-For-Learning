import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useEssayStore } from '../../store/essayStore';
import { useAuthStore } from '../../store/authStore';
import { Essay } from '../../types';
import toast from 'react-hot-toast';

interface EssaySubmissionFormProps {
  assignmentId?: string;
  essay?: Essay | null; // For editing existing essays
  onSubmit?: (essayData: any) => void;
  onClose?: () => void;
}

export const EssaySubmissionForm: React.FC<EssaySubmissionFormProps> = ({ 
  assignmentId,
  essay,
  onSubmit,
  onClose 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { submitEssay, isLoading } = useEssayStore();
  const { user } = useAuthStore();

  // Populate form when editing
  useEffect(() => {
    if (essay) {
      setTitle(essay.title);
      setContent(essay.content || '');
      // Note: We can't set the file from existing essay, user needs to reupload
    }
  }, [essay]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || (!content.trim() && !file)) {
      toast.error('Please provide a title and either content or upload a file');
      return;
    }
    
    try {
      const essayData = {
        title,
        content,
        file_name: file?.name,
        file_size: file?.size,
        student_id: user?.id || '',
        assignment_id: assignmentId, // Link to the assignment
      };

      if (onSubmit) {
        // For editing existing essays
        await onSubmit(essayData);
      } else {
        // For new submissions
        await submitEssay(essayData);
        toast.success('Essay submitted successfully!');
      }
      
      // Reset form
      setTitle('');
      setContent('');
      setFile(null);
      
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to submit essay');
    }
  };

  return (
    <div className="space-y-6">
      {assignmentId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This essay will be submitted for the selected assignment. 
            Make sure your essay addresses all the assignment requirements.
          </p>
        </div>
      )}

      {essay && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Editing Essay:</strong> You are editing an existing submission. 
            {essay.status === 'graded' && ' Note that resubmitting will reset your grade.'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Essay Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your essay title"
          required
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File {essay ? '(Optional - leave empty to keep current file)' : '(Optional)'}
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
              
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                  {essay?.file_name && (
                    <p className="text-xs text-blue-600 mt-2">
                      Current file: {essay.file_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Text Input */}
          <div>
            <Textarea
              label="Essay Content (Optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your essay content here or upload a file"
              rows={10}
              className="resize-none"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-4">
          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            {essay ? 'Update Essay' : 'Submit Essay'}
          </Button>
        </div>
      </form>
    </div>
  );
};