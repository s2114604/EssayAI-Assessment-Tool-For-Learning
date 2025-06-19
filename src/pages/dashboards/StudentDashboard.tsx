import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, BookOpen, Clock, Award, Plus, Calendar, Eye, Edit, CheckCircle, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useEssayStore } from '../../store/essayStore';
import { useAssignmentStore } from '../../store/assignmentStore';
import { useUserStore } from '../../store/userStore';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { essays, loadStudentEssays, isLoading: essaysLoading } = useEssayStore();
  const { assignments, loadStudentAssignments, isLoading: assignmentsLoading } = useAssignmentStore();
  const { getUserById } = useUserStore();

  useEffect(() => {
    if (user?.id) {
      console.log('🎓 Student Dashboard: Loading data for student:', user.full_name);
      loadStudentEssays(user.id);
      loadStudentAssignments(user.id);
    }
  }, [user?.id, loadStudentEssays, loadStudentAssignments]);

  // Get student's teacher information
  const studentTeacher = user?.role === 'student' && user.teacher_id 
    ? getUserById(user.teacher_id) 
    : null;

  // Calculate statistics from real data
  const stats = {
    totalEssays: essays.length,
    averageGrade: essays.filter(e => e.grade).length > 0 
      ? Math.round(essays.filter(e => e.grade).reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / essays.filter(e => e.grade).length * 10) / 10
      : 0,
    pendingEssays: essays.filter(e => e.status === 'submitted' || e.status === 'grading').length,
    gradedEssays: essays.filter(e => e.grade).length,
    aiGradedEssays: essays.filter(e => e.grade?.graded_by === 'ai').length,
    teacherGradedEssays: essays.filter(e => e.grade?.graded_by === 'teacher').length,
    activeAssignments: assignments.filter(a => a.is_active && new Date(a.due_date) > new Date()).length,
    overdueAssignments: assignments.filter(a => a.is_active && new Date(a.due_date) < new Date()).length,
  };

  // Get recent essays (last 5) - FIXED: Ensure grades are properly displayed
  const recentSubmissions = essays
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  // Get upcoming assignments (next 3)
  const upcomingAssignments = assignments
    .filter(a => a.is_active && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'grading': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const submittedDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const getAssignmentProgress = (assignment: any) => {
    const submission = essays.find(e => e.assignment_id === assignment.id);
    if (submission) {
      switch (submission.status) {
        case 'graded': return 100;
        case 'grading': return 80;
        case 'submitted': return 60;
        default: return 0;
      }
    }
    return 0;
  };

  if (essaysLoading && essays.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-gray-600 mt-1">
            {stats.pendingEssays > 0 
              ? `You have ${stats.pendingEssays} assignment${stats.pendingEssays > 1 ? 's' : ''} pending review`
              : stats.activeAssignments > 0
              ? `You have ${stats.activeAssignments} active assignment${stats.activeAssignments > 1 ? 's' : ''}`
              : 'All caught up! Great work!'
            }
          </p>
          {studentTeacher && (
            <p className="text-sm text-blue-600 mt-1">
              Your teacher: {studentTeacher.full_name}
            </p>
          )}
        </div>
        <Button 
          variant="primary" 
          className="flex items-center space-x-2"
          onClick={() => navigate('/assignments')}
        >
          <Plus className="w-4 h-4" />
          <span>View Assignments</span>
        </Button>
      </div>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.totalEssays}</div>
          <div className="text-sm text-gray-600">Essays Submitted</div>
          <div className="mt-2 text-xs text-gray-500">
            Total submissions
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-green-600">
            {stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Average Grade</div>
          <div className="mt-2 text-xs text-gray-500">
            Overall performance
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-orange-600">{stats.pendingEssays}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="mt-2 text-xs text-gray-500">
            Awaiting grades
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-purple-600">{stats.activeAssignments}</div>
          <div className="text-sm text-gray-600">Active Assignments</div>
          <div className="mt-2 text-xs text-gray-500">
            Available to submit
          </div>
        </Card>
      </div>

      {/* Grade Results Banner - ENHANCED */}
      {stats.gradedEssays > 0 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-900">🎉 Grade Results Available!</h3>
                <p className="text-xs text-green-700">
                  {stats.gradedEssays} essay{stats.gradedEssays !== 1 ? 's' : ''} graded 
                  ({stats.teacherGradedEssays} by teacher, {stats.aiGradedEssays} by AI) - 
                  Average: {stats.averageGrade}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">Click "View Grade Details" on any graded essay</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assignments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Assignments</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/assignments')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((assignment) => {
                const daysLeft = getDaysUntilDue(assignment.due_date);
                const progress = getAssignmentProgress(assignment);
                const submission = essays.find(e => e.assignment_id === assignment.id);
                
                return (
                  <div key={assignment.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate pr-2">
                          {assignment.title}
                        </p>
                        <p className="text-xs text-blue-600">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${
                          daysLeft <= 1 ? 'text-red-600' :
                          daysLeft <= 3 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {daysLeft === 0 ? 'Due today' :
                           daysLeft === 1 ? 'Due tomorrow' :
                           `${daysLeft} days left`}
                        </span>
                        {submission && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          {submission ? `Status: ${submission.status}` : 'Not submitted'}
                        </span>
                        {/* FIXED: Show grade properly */}
                        {submission?.grade && (
                          <span className={`text-xs font-medium ${getGradeColor(submission.grade.total_score)}`}>
                            Grade: {submission.grade.total_score}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progress >= 100 ? 'bg-green-500' :
                              progress >= 80 ? 'bg-blue-500' :
                              progress >= 60 ? 'bg-yellow-500' :
                              progress > 0 ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.max(progress, 5)}%` }}
                          ></div>
                        </div>
                        {!submission && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/assignments')}
                            className="text-xs"
                          >
                            Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming assignments</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/assignments')}
                >
                  View All Assignments
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* My Submitted Essays - FIXED: Show grades properly */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Submitted Essays</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/essays')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((essay) => {
                // FIXED: Debug grade display for student dashboard
                console.log('🎯 Student Dashboard - Essay grade check:', {
                  essayId: essay.id,
                  essayTitle: essay.title,
                  hasGrade: !!essay.grade,
                  gradeData: essay.grade ? {
                    totalScore: essay.grade.total_score,
                    maxScore: essay.grade.max_score,
                    gradedBy: essay.grade.graded_by
                  } : null
                });
                
                return (
                  <div key={essay.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate pr-2">
                          {essay.title}
                        </p>
                        {essay.assignment && (
                          <p className="text-xs text-blue-600">
                            Assignment: {essay.assignment.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(essay.status)}`}>
                          {essay.status}
                        </span>
                        {/* FIXED: Properly display grade */}
                        {essay.grade && (
                          <span className={`text-sm font-bold ${getGradeColor(essay.grade.total_score)}`}>
                            {essay.grade.total_score}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{getTimeAgo(essay.submitted_at)}</p>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/essays')}
                          className="text-xs px-2 py-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {essay.grade && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/essays')}
                            className="text-xs px-2 py-1 text-green-600 hover:bg-green-50"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Grade Details
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* FIXED: Show grade feedback preview if available */}
                    {essay.grade?.feedback && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        <strong>Grade:</strong> {essay.grade.total_score}/{essay.grade.max_score} 
                        ({Math.round((essay.grade.total_score / essay.grade.max_score) * 100)}%) - 
                        {essay.grade.graded_by === 'ai' ? ' AI Analysis Complete' : ' Teacher Graded'}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No submitted essays yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/assignments')}
                >
                  View Assignments
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions for Students */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">📚 Student Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            variant="outline"
            onClick={() => navigate('/assignments')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-900">View Assignments</div>
              <div className="text-sm text-blue-700">See all available assignments</div>
              {stats.activeAssignments > 0 && (
                <div className="mt-2 px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                  {stats.activeAssignments} active!
                </div>
              )}
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/essays')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-green-300 hover:border-green-400 hover:bg-green-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-900">My Essays</div>
              <div className="text-sm text-green-700">View submissions and grades</div>
              {stats.gradedEssays > 0 && (
                <div className="mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                  {stats.gradedEssays} graded!
                </div>
              )}
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/grades')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-purple-900">View Grades</div>
              <div className="text-sm text-purple-700">Check your performance</div>
              {stats.averageGrade > 0 && (
                <div className="mt-2 px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-bold">
                  Avg: {stats.averageGrade}%
                </div>
              )}
            </div>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};