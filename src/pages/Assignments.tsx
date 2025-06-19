import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, BookOpen, Calendar, Users, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { AssignmentForm } from '../components/assignment/AssignmentForm';
import { AssignmentCard } from '../components/assignment/AssignmentCard';
import { AssignmentSubmissionsView } from '../components/assignment/AssignmentSubmissionsView';
import { EssaySubmissionForm } from '../components/essay/EssaySubmissionForm';
import { EssayGradeDisplay } from '../components/essay/EssayGradeDisplay';
import { useAssignmentStore } from '../store/assignmentStore';
import { useEssayStore } from '../store/essayStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { Assignment } from '../types';
import toast from 'react-hot-toast';

export const Assignments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showEssayForm, setShowEssayForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<Assignment | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedEssayForGrade, setSelectedEssayForGrade] = useState<any>(null);

  const { user } = useAuthStore();
  const { getUserById } = useUserStore();
  const {
    assignments,
    isLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    loadTeacherAssignments,
    loadStudentAssignments,
  } = useAssignmentStore();

  const { 
    essays,
    loadStudentEssays,
    getStudentSubmissionForAssignment 
  } = useEssayStore();

  // Get student's teacher information
  const studentTeacher = user?.role === 'student' && user.teacher_id 
    ? getUserById(user.teacher_id) 
    : null;

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        loadTeacherAssignments(user.id);
      } else if (user.role === 'student') {
        loadStudentAssignments(user.id);
        loadStudentEssays(user.id); // Load student's essays to check submissions
      }
    }
  }, [user, loadTeacherAssignments, loadStudentAssignments, loadStudentEssays]);

  // Listen for custom grade viewing events
  useEffect(() => {
    const handleViewDetailedGrade = (event: any) => {
      const essay = event.detail.essay;
      if (essay?.grade) {
        console.log('📊 Opening detailed grade view for:', essay.title);
        setSelectedEssayForGrade(essay);
        setShowGradeModal(true);
      }
    };

    window.addEventListener('viewDetailedGrade', handleViewDetailedGrade);
    return () => {
      window.removeEventListener('viewDetailedGrade', handleViewDetailedGrade);
    };
  }, []);

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setShowAssignmentForm(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment');
    }
  };

  const handleSubmitAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, assignmentData);
        toast.success('Assignment updated successfully');
      } else {
        await createAssignment(assignmentData);
        toast.success('Assignment created successfully');
      }
      setShowAssignmentForm(false);
      setEditingAssignment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save assignment');
    }
  };

  const handleSubmitEssay = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowEssayForm(true);
  };

  const handleViewSubmissions = (assignment: Assignment) => {
    setViewingSubmissions(assignment);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'active') {
      matchesFilter = assignment.is_active;
    } else if (filterStatus === 'inactive') {
      matchesFilter = !assignment.is_active;
    } else if (filterStatus === 'overdue') {
      matchesFilter = new Date(assignment.due_date) < new Date();
    } else if (filterStatus === 'upcoming') {
      matchesFilter = new Date(assignment.due_date) > new Date();
    }
    
    return matchesSearch && matchesFilter;
  });

  const getPageTitle = () => {
    switch (user?.role) {
      case 'teacher': return 'My Assignments';
      case 'student': return 'Available Assignments';
      default: return 'Assignments';
    }
  };

  const getEmptyStateMessage = () => {
    switch (user?.role) {
      case 'teacher': return 'Create your first assignment to get started';
      case 'student': 
        if (!user.teacher_id) {
          return 'You are not assigned to a teacher yet. Please contact your administrator.';
        }
        return `No assignments available from ${studentTeacher?.full_name || 'your teacher'} yet`;
      default: return 'No assignments found';
    }
  };

  // If viewing submissions, show the submissions view
  if (viewingSubmissions) {
    return (
      <AssignmentSubmissionsView
        assignment={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
      />
    );
  }

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'teacher' 
              ? 'Create and manage assignments for your students'
              : user?.role === 'student' && studentTeacher
              ? `Assignments from ${studentTeacher.full_name}`
              : 'View and submit assignments from your teacher'
            }
          </p>
        </div>
        {user?.role === 'teacher' && (
          <Button
            variant="primary"
            onClick={handleCreateAssignment}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </Button>
        )}
      </div>

      {/* Student not assigned warning */}
      {user?.role === 'student' && !user.teacher_id && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Not Assigned to Teacher</h3>
              <p className="text-sm text-yellow-700">
                You are not currently assigned to a teacher. Please contact your administrator to be assigned to a teacher to view assignments.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Teacher info for students */}
      {user?.role === 'student' && studentTeacher && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Your Teacher</h3>
              <p className="text-sm text-blue-700">
                You are assigned to <strong>{studentTeacher.full_name}</strong> ({studentTeacher.email})
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards for Teachers */}
      {user?.role === 'teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
            <div className="text-sm text-gray-600">Total Assignments</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {assignments.filter(a => new Date(a.due_date) < new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => new Date(a.due_date) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      {(assignments.length > 0 || searchTerm || filterStatus !== 'all') && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search assignments..."
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
                <option value="all">All Assignments</option>
                <option value="active">Active</option>
                {user?.role === 'teacher' && <option value="inactive">Inactive</option>}
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Assignments Grid */}
      {filteredAssignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            // For students, check if they have submitted for this assignment
            const userSubmission = user?.role === 'student' 
              ? getStudentSubmissionForAssignment(user.id, assignment.id)
              : undefined;

            return (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                userRole={user?.role || 'student'}
                onEdit={handleEditAssignment}
                onDelete={(id) => setShowDeleteConfirm(id)}
                onViewSubmissions={handleViewSubmissions}
                onSubmitEssay={handleSubmitEssay}
                submissionCount={0} // TODO: Get actual submission count
                hasSubmitted={!!userSubmission}
                userSubmission={userSubmission}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : getEmptyStateMessage()
            }
          </p>
          {user?.role === 'teacher' && (
            <Button variant="primary" onClick={handleCreateAssignment}>
              Create Your First Assignment
            </Button>
          )}
        </Card>
      )}

      {/* Assignment Form Modal */}
      <Modal
        isOpen={showAssignmentForm}
        onClose={() => {
          setShowAssignmentForm(false);
          setEditingAssignment(null);
        }}
        title={editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
        size="xl"
      >
        <AssignmentForm
          assignment={editingAssignment}
          onSubmit={handleSubmitAssignment}
          onCancel={() => {
            setShowAssignmentForm(false);
            setEditingAssignment(null);
          }}
          isLoading={isLoading}
          teacherId={user?.id || ''}
        />
      </Modal>

      {/* Essay Submission Modal */}
      <Modal
        isOpen={showEssayForm}
        onClose={() => {
          setShowEssayForm(false);
          setSelectedAssignment(null);
        }}
        title={`Submit Essay for: ${selectedAssignment?.title}`}
        size="xl"
      >
        <EssaySubmissionForm
          assignmentId={selectedAssignment?.id}
          onClose={() => {
            setShowEssayForm(false);
            setSelectedAssignment(null);
          }}
        />
      </Modal>

      {/* Grade Details Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setSelectedEssayForGrade(null);
        }}
        title="Detailed AI Grade Analysis"
        size="xl"
      >
        {selectedEssayForGrade?.grade && (
          <EssayGradeDisplay grade={selectedEssayForGrade.grade} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <BookOpen className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Assignment</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this assignment? This action cannot be undone and will also delete all student submissions.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDeleteAssignment(showDeleteConfirm)}
              loading={isLoading}
            >
              Delete Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};