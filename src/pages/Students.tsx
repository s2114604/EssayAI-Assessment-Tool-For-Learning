import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Mail, Phone, Calendar, BookOpen, Award, FileText, TrendingUp, Eye, Edit, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useEssayStore } from '../store/essayStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { useNavigate } from 'react-router-dom';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { users, loadUsers, isLoading: usersLoading } = useUserStore();
  const { essays, loadTeacherEssays, isLoading: essaysLoading } = useEssayStore();
  const { assignments, loadTeacherAssignments } = useAssignmentStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.id) {
      console.log('👥 Loading students page for teacher:', user.full_name);
      loadUsers();
      loadTeacherEssays(user.id);
      loadTeacherAssignments(user.id);
    }
  }, [user?.id, loadUsers, loadTeacherEssays, loadTeacherAssignments]);

  // Get students assigned to this teacher
  const myStudents = users.filter(u => u.role === 'student' && u.teacher_id === user?.id);

  // Filter students based on search and status
  const filteredStudents = myStudents.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'active') {
      const studentEssays = essays.filter(e => e.student_id === student.id);
      matchesFilter = studentEssays.length > 0;
    } else if (filterStatus === 'inactive') {
      const studentEssays = essays.filter(e => e.student_id === student.id);
      matchesFilter = studentEssays.length === 0;
    } else if (filterStatus === 'high_performer') {
      const studentEssays = essays.filter(e => e.student_id === student.id && e.grade);
      const avgGrade = studentEssays.length > 0 
        ? studentEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / studentEssays.length
        : 0;
      matchesFilter = avgGrade >= 85;
    } else if (filterStatus === 'needs_attention') {
      const studentEssays = essays.filter(e => e.student_id === student.id && e.grade);
      const avgGrade = studentEssays.length > 0 
        ? studentEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / studentEssays.length
        : 0;
      matchesFilter = avgGrade < 70 && avgGrade > 0;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Calculate student statistics
  const getStudentStats = (studentId: string) => {
    const studentEssays = essays.filter(e => e.student_id === studentId);
    const gradedEssays = studentEssays.filter(e => e.grade);
    const pendingEssays = studentEssays.filter(e => e.status === 'submitted' && !e.grade);
    const averageGrade = gradedEssays.length > 0 
      ? Math.round(gradedEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / gradedEssays.length)
      : 0;
    
    return {
      totalEssays: studentEssays.length,
      gradedEssays: gradedEssays.length,
      pendingEssays: pendingEssays.length,
      averageGrade,
      lastSubmission: studentEssays.length > 0 
        ? studentEssays.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]
        : null
    };
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (avgGrade: number) => {
    if (avgGrade >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (avgGrade >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (avgGrade >= 70) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800' };
    if (avgGrade > 0) return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    return { label: 'No Grades', color: 'bg-gray-100 text-gray-800' };
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const submittedDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Overall class statistics
  const classStats = {
    totalStudents: myStudents.length,
    activeStudents: myStudents.filter(s => essays.some(e => e.student_id === s.id)).length,
    totalSubmissions: essays.length,
    averageClassGrade: essays.filter(e => e.grade).length > 0 
      ? Math.round(essays.filter(e => e.grade).reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / essays.filter(e => e.grade).length)
      : 0,
    highPerformers: myStudents.filter(s => {
      const studentEssays = essays.filter(e => e.student_id === s.id && e.grade);
      const avgGrade = studentEssays.length > 0 
        ? studentEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / studentEssays.length
        : 0;
      return avgGrade >= 85;
    }).length,
    needsAttention: myStudents.filter(s => {
      const studentEssays = essays.filter(e => e.student_id === s.id && e.grade);
      const avgGrade = studentEssays.length > 0 
        ? studentEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / studentEssays.length
        : 0;
      return avgGrade < 70 && avgGrade > 0;
    }).length,
  };

  if (usersLoading && myStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your {myStudents.length} assigned student{myStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/essays')}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>View All Essays</span>
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/assignments')}
            className="flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Assignments</span>
          </Button>
        </div>
      </div>

      {/* Class Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{classStats.totalStudents}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{classStats.activeStudents}</div>
          <div className="text-sm text-gray-600">Active Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{classStats.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {classStats.averageClassGrade > 0 ? `${classStats.averageClassGrade}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Class Average</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{classStats.needsAttention}</div>
          <div className="text-sm text-gray-600">Need Attention</div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students by name or email..."
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
              <option value="all">All Students</option>
              <option value="active">Active (Has Submissions)</option>
              <option value="inactive">Inactive (No Submissions)</option>
              <option value="high_performer">High Performers (85%+)</option>
              <option value="needs_attention">Needs Attention (&lt;70%)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.map((student) => {
          const stats = getStudentStats(student.id);
          const performance = getPerformanceLevel(stats.averageGrade);
          
          return (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.full_name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Phone className="w-4 h-4" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${performance.color}`}>
                  {performance.label}
                </span>
              </div>

              {/* Student Statistics */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalEssays}</div>
                  <div className="text-xs text-gray-600">Essays</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.gradedEssays}</div>
                  <div className="text-xs text-gray-600">Graded</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.pendingEssays}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${stats.averageGrade > 0 ? getGradeColor(stats.averageGrade) : 'text-gray-400'}`}>
                    {stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Average</div>
                </div>
              </div>

              {/* Last Submission Info */}
              {stats.lastSubmission && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Submission</p>
                      <p className="text-xs text-gray-600">{stats.lastSubmission.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{getTimeAgo(stats.lastSubmission.submitted_at)}</p>
                      {stats.lastSubmission.grade && (
                        <p className={`text-sm font-bold ${getGradeColor(stats.lastSubmission.grade.total_score)}`}>
                          {stats.lastSubmission.grade.total_score}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Student Info */}
              <div className="text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/essays')}
                    className="flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Essays</span>
                  </Button>
                  {stats.averageGrade > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/essays')}
                      className="flex items-center space-x-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Progress</span>
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {stats.pendingEssays > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/essays')}
                      className="flex items-center space-x-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Grade ({stats.pendingEssays})</span>
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/essays')}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Details</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : myStudents.length === 0
              ? 'You don\'t have any students assigned to you yet. Contact your administrator to assign students.'
              : 'No students match your current filters'
            }
          </p>
          {myStudents.length === 0 && (
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          )}
        </Card>
      )}

      {/* Performance Summary */}
      {myStudents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{classStats.highPerformers}</div>
              <div className="text-sm text-green-800">High Performers</div>
              <div className="text-xs text-green-600">85% average or higher</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {myStudents.length - classStats.highPerformers - classStats.needsAttention}
              </div>
              <div className="text-sm text-blue-800">Average Performers</div>
              <div className="text-xs text-blue-600">70-84% average</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{classStats.needsAttention}</div>
              <div className="text-sm text-red-800">Need Attention</div>
              <div className="text-xs text-red-600">Below 70% average</div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
};