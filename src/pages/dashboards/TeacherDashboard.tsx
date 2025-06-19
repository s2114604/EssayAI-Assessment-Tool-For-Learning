import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText,Brain, Users, Clock, TrendingUp, Plus, BookOpen, Award, Calendar, Eye, Edit, Star, Bot, User, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useAssignmentStore } from '../../store/assignmentStore';
import { useEssayStore } from '../../store/essayStore';
import { useUserStore } from '../../store/userStore';
import { useNavigate } from 'react-router-dom';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { assignments, loadTeacherAssignments, isLoading: assignmentsLoading } = useAssignmentStore();
  const { essays, loadTeacherEssays, isLoading: essaysLoading } = useEssayStore();
  const { users, loadUsers } = useUserStore();

  useEffect(() => {
    if (user?.id) {
      console.log('👨‍🏫 Teacher Dashboard: Loading data for teacher:', user.full_name);
      loadTeacherAssignments(user.id);
      loadTeacherEssays(user.id);
      loadUsers();
    }
  }, [user?.id, loadTeacherAssignments, loadTeacherEssays, loadUsers]);

  // Get students assigned to this teacher
  const myStudents = users.filter(u => u.role === 'student' && u.teacher_id === user?.id);
  
  // Calculate teacher-specific statistics
  const stats = {
    essaysToGrade: essays.filter(e => e.status === 'submitted' && !e.grade).length,
    myStudents: myStudents.length,
    myAssignments: assignments.length,
    gradedEssays: essays.filter(e => e.grade).length,
    aiGradedEssays: essays.filter(e => e.grade?.graded_by === 'ai').length,
    teacherGradedEssays: essays.filter(e => e.grade?.graded_by === 'teacher').length,
    classAverage: essays.filter(e => e.grade).length > 0 
      ? Math.round(essays.filter(e => e.grade).reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / essays.filter(e => e.grade).length)
      : 0,
    activeAssignments: assignments.filter(a => a.is_active).length,
    overdueAssignments: assignments.filter(a => new Date(a.due_date) < new Date()).length,
    aiDetectedEssays: essays.filter(e => e.ai_detection_report).length,
    highRiskAI: essays.filter(e => e.ai_detection_report && e.ai_detection_report.ai_probability >= 0.7).length,
    plagiarismChecked: essays.filter(e => e.plagiarism_report).length,
  };

  // Get recent submissions (last 5) - FIXED: Ensure grades are properly displayed
  const recentSubmissions = essays
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  // Get upcoming assignment deadlines (next 3)
  const upcomingDeadlines = assignments
    .filter(a => a.is_active && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  const getStatusColor = (status: string) => {
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

  const getSubmissionCount = (assignmentId: string) => {
    return essays.filter(e => e.assignment_id === assignmentId).length;
  };

  if ((assignmentsLoading || essaysLoading) && assignments.length === 0 && essays.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher dashboard...</p>
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
            Welcome back, {user?.full_name?.split(' ')[0] || 'Teacher'}
          </h1>
          <p className="text-gray-600 mt-1">
            {stats.essaysToGrade > 0 
              ? `You have ${stats.essaysToGrade} essay${stats.essaysToGrade > 1 ? 's' : ''} waiting for grading`
              : stats.myStudents > 0
              ? `Managing ${stats.myStudents} student${stats.myStudents > 1 ? 's' : ''} and ${stats.myAssignments} assignment${stats.myAssignments > 1 ? 's' : ''}`
              : 'Ready to create assignments and manage students'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {stats.essaysToGrade > 0 && (
            <Button 
              variant="secondary" 
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              onClick={() => navigate('/essays')}
            >
              <Edit className="w-4 h-4" />
              <span>Grade Essays ({stats.essaysToGrade})</span>
            </Button>
          )}
          <Button 
            variant="primary" 
            className="flex items-center space-x-2"
            onClick={() => navigate('/assignments')}
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Teacher Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-red-600">{stats.essaysToGrade}</div>
          <div className="text-sm text-gray-600">Essays to Grade</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.essaysToGrade > 0 ? 'Awaiting your review' : 'All caught up!'}
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.myStudents}</div>
          <div className="text-sm text-gray-600">My Students</div>
          <div className="mt-2 text-xs text-gray-500">
            Assigned to you
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-green-600">{stats.gradedEssays}</div>
          <div className="text-sm text-gray-600">Graded Essays</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.aiGradedEssays} AI, {stats.teacherGradedEssays} manual
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-purple-600">
            {stats.classAverage > 0 ? `${stats.classAverage}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Class Average</div>
          <div className="mt-2 text-xs text-gray-500">
            Overall performance
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-orange-600">{stats.highRiskAI}</div>
          <div className="text-sm text-gray-600">High AI Risk</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.aiDetectedEssays} total analyzed
          </div>
        </Card>
      </div>

      {/* Grading Alert Banner */}
      {stats.essaysToGrade > 0 && (
        <Card className="p-6 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-2 border-orange-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Edit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-1">
                  🎯 {stats.essaysToGrade} Essay{stats.essaysToGrade !== 1 ? 's' : ''} Ready for Grading!
                </h3>
                <p className="text-orange-700 mb-2">
                  Students are waiting for grades. Use AI grading for instant results or manual grading for detailed feedback.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700">AI Grading Available</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Manual Grading Ready</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/essays')}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <Edit className="w-5 h-5" />
                  <span>Start Grading Now</span>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Analytics Alert Banner */}
      {stats.highRiskAI > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-red-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-purple-900">
                  ⚠️ {stats.highRiskAI} Essay{stats.highRiskAI !== 1 ? 's' : ''} with High AI Detection Risk
                </h3>
                <p className="text-xs text-purple-700">
                  Review detailed analytics and student reports for academic integrity concerns
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              className="flex items-center space-x-1 border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Reports</span>
            </Button>
          </div>
        </Card>
      )}

      {/* No Essays Banner */}
      {stats.essaysToGrade === 0 && essays.length === 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-blue-900 mb-2">Ready to Start Teaching!</h3>
            <p className="text-blue-700 mb-4">
              Create assignments for your students and start receiving essay submissions for grading.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/assignments')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create Your First Assignment
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions - FIXED: Show grades properly */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/essays')}
            >
              View All Essays
            </Button>
          </div>
          <div className="space-y-3">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((essay) => {
                const student = users.find(u => u.id === essay.student_id);
                
                // FIXED: Debug grade display
                console.log('🎯 Teacher Dashboard - Essay grade check:', {
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
                        <p className="text-xs text-blue-600">
                          by {student?.full_name || 'Unknown Student'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(essay.status)}`}>
                          {essay.status}
                        </span>
                        {/* FIXED: Properly display grade */}
                        {essay.grade && (
                          <div className="flex items-center space-x-1">
                            <span className={`text-sm font-bold ${getGradeColor(essay.grade.total_score)}`}>
                              {essay.grade.total_score}%
                            </span>
                            {essay.grade.graded_by === 'ai' ? (
                              <Bot className="w-3 h-3 text-blue-600" title="AI Graded" />
                            ) : (
                              <User className="w-3 h-3 text-green-600" title="Teacher Graded" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{getTimeAgo(essay.submitted_at)}</p>
                      <div className="flex items-center space-x-1">
                        {essay.grade ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/essays')}
                            className="text-xs px-2 py-1 text-green-600 hover:bg-green-50"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            View Grade
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/essays')}
                            className="text-xs px-2 py-1 text-orange-600 hover:bg-orange-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Grade Now
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* FIXED: Show grade feedback preview if available */}
                    {essay.grade?.feedback && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-800 line-clamp-2">
                          <strong>Grade:</strong> {essay.grade.total_score}/{essay.grade.max_score} 
                          ({Math.round((essay.grade.total_score / essay.grade.max_score) * 100)}%) - 
                          {essay.grade.graded_by === 'ai' ? ' AI Analysis Complete' : ' Teacher Graded'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent submissions</p>
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

        {/* My Assignments & Deadlines */}
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
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((assignment) => {
                const daysLeft = getDaysUntilDue(assignment.due_date);
                const submissionCount = getSubmissionCount(assignment.id);
                const expectedSubmissions = myStudents.length;
                const submissionRate = expectedSubmissions > 0 ? Math.round((submissionCount / expectedSubmissions) * 100) : 0;
                
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
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          {submissionCount}/{expectedSubmissions} submitted ({submissionRate}%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              submissionRate >= 80 ? 'bg-green-500' :
                              submissionRate >= 60 ? 'bg-blue-500' :
                              submissionRate >= 40 ? 'bg-yellow-500' :
                              submissionRate > 0 ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.max(submissionRate, 5)}%` }}
                          ></div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/assignments')}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
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
                  Create Assignment
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions for Teachers */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🎯 Teacher Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Button
            variant="outline"
            onClick={() => navigate('/essays')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-900">Grade Essays</div>
              <div className="text-sm text-orange-700">AI & Manual grading</div>
              {stats.essaysToGrade > 0 && (
                <div className="mt-2 px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                  {stats.essaysToGrade} waiting!
                </div>
              )}
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/assignments')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-green-300 hover:border-green-400 hover:bg-green-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-900">Create Assignment</div>
              <div className="text-sm text-green-700">New assignment</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/students')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-purple-900">Manage Students</div>
              <div className="text-sm text-purple-700">View student progress</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center justify-center space-y-3 p-6 h-auto border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 group"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-900">Analytics & Reports</div>
              <div className="text-sm text-blue-700">Student performance</div>
              <div className="mt-2 px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                New!
              </div>
            </div>
          </Button>
        </div>
      </Card>

      {/* My Students Overview */}
      {myStudents.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Students ({myStudents.length})</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/students')}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStudents.slice(0, 6).map((student) => {
              const studentEssays = essays.filter(e => e.student_id === student.id);
              const gradedEssays = studentEssays.filter(e => e.grade);
              const averageGrade = gradedEssays.length > 0 
                ? Math.round(gradedEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / gradedEssays.length)
                : 0;
              
              return (
                <div key={student.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{student.full_name}</p>
                      <p className="text-xs text-blue-700">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600">
                      {studentEssays.length} submission{studentEssays.length !== 1 ? 's' : ''}
                    </span>
                    {averageGrade > 0 && (
                      <span className={`font-medium ${getGradeColor(averageGrade)}`}>
                        Avg: {averageGrade}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {myStudents.length > 6 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/students')}
              >
                View All {myStudents.length} Students
              </Button>
            </div>
          )}
        </Card>
      )}
      
      {/* Analytics Preview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">📊 Class Analytics Available</h3>
              <p className="text-sm text-blue-700">View detailed performance reports and student analytics</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/reports')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>View Full Reports</span>
            </div>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/80 rounded-lg border border-blue-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">Performance</h4>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.classAverage}%</div>
            <p className="text-xs text-blue-700">Class average score</p>
          </div>
          
          <div className="p-4 bg-white/80 rounded-lg border border-purple-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-900">AI Content</h4>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">{stats.highRiskAI}</div>
            <p className="text-xs text-purple-700">High-risk AI essays</p>
          </div>
          
          <div className="p-4 bg-white/80 rounded-lg border border-green-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Completion</h4>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {essays.length > 0 ? Math.round((stats.gradedEssays / essays.length) * 100) : 0}%
            </div>
            <p className="text-xs text-green-700">Grading completion rate</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};