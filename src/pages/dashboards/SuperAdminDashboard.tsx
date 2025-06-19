import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp, Shield, AlertTriangle, CheckCircle, Settings, UserPlus, FileText, Award } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useEssayStore } from '../../store/essayStore';
import { useAssignmentStore } from '../../store/assignmentStore';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { users, loadUsers, isLoading: usersLoading } = useUserStore();
  const { essays, loadEssays, isLoading: essaysLoading } = useEssayStore();
  const { assignments, loadAssignments, isLoading: assignmentsLoading } = useAssignmentStore();

  useEffect(() => {
    console.log('🔧 Super Admin Dashboard: Loading all system data...');
    loadUsers();
    loadEssays();
    loadAssignments();
  }, [loadUsers, loadEssays, loadAssignments]);

  // Calculate comprehensive system statistics
  const stats = {
    totalUsers: users.length,
    totalAdmins: users.filter(u => u.role === 'super_admin').length,
    totalTeachers: users.filter(u => u.role === 'teacher').length,
    totalStudents: users.filter(u => u.role === 'student').length,
    unassignedStudents: users.filter(u => u.role === 'student' && !u.teacher_id).length,
    totalEssays: essays.length,
    totalAssignments: assignments.length,
    gradedEssays: essays.filter(e => e.grade).length,
    aiGradedEssays: essays.filter(e => e.grade?.graded_by === 'ai').length,
    teacherGradedEssays: essays.filter(e => e.grade?.graded_by === 'teacher').length,
    pendingEssays: essays.filter(e => e.status === 'submitted' && !e.grade).length,
    activeAssignments: assignments.filter(a => a.is_active).length,
  };

  const systemHealth = {
    userManagement: stats.totalUsers > 0 ? 100 : 0,
    essaySystem: stats.totalEssays > 0 ? 100 : 0,
    gradingSystem: stats.gradedEssays > 0 ? 100 : 0,
    assignmentSystem: stats.totalAssignments > 0 ? 100 : 0,
  };

  const overallHealth = Math.round(
    (systemHealth.userManagement + systemHealth.essaySystem + systemHealth.gradingSystem + systemHealth.assignmentSystem) / 4
  );

  const recentActivities = [
    { id: 1, user: 'System', action: 'Database backup completed', time: '2 minutes ago', type: 'success' },
    { id: 2, user: 'AI Grader', action: `${stats.aiGradedEssays} essays graded automatically`, time: '5 minutes ago', type: 'info' },
    { id: 3, user: 'System', action: `${stats.pendingEssays} essays awaiting grading`, time: '10 minutes ago', type: stats.pendingEssays > 0 ? 'warning' : 'success' },
    { id: 4, user: 'User Management', action: `${stats.unassignedStudents} students need teacher assignment`, time: '15 minutes ago', type: stats.unassignedStudents > 0 ? 'warning' : 'success' },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove users from the system',
      icon: Users,
      action: () => navigate('/users'),
      color: 'blue',
      count: stats.totalUsers,
    },
    {
      title: 'System Essays',
      description: 'View all essays and grading status',
      icon: FileText,
      action: () => navigate('/essays'),
      color: 'green',
      count: stats.totalEssays,
    },
    {
      title: 'All Assignments',
      description: 'Monitor all teacher assignments',
      icon: BookOpen,
      action: () => navigate('/assignments'),
      color: 'purple',
      count: stats.totalAssignments,
    },
    {
      title: 'System Analytics',
      description: 'View detailed system analytics and reports',
      icon: TrendingUp,
      action: () => navigate('/analytics'),
      color: 'orange',
      count: `${overallHealth}%`,
    },
  ];

  if ((usersLoading || essaysLoading || assignmentsLoading) && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your EssayAI platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${overallHealth >= 90 ? 'text-green-600' : overallHealth >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">System Health: {overallHealth}%</span>
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.totalAdmins} admins, {stats.totalTeachers} teachers, {stats.totalStudents} students
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-green-600">{stats.totalEssays}</div>
          <div className="text-sm text-gray-600">Total Essays</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.gradedEssays} graded, {stats.pendingEssays} pending
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-purple-600">{stats.totalAssignments}</div>
          <div className="text-sm text-gray-600">Total Assignments</div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.activeAssignments} active
          </div>
        </Card>
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="text-3xl font-bold text-orange-600">{overallHealth}%</div>
          <div className="text-sm text-gray-600">System Health</div>
          <div className="mt-2 text-xs text-gray-500">
            All systems operational
          </div>
        </Card>
      </div>

      {/* Grading System Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.aiGradedEssays}</div>
            <div className="text-sm text-blue-800">AI Graded Essays</div>
            <div className="text-xs text-blue-600 mt-1">Automated grading system</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.teacherGradedEssays}</div>
            <div className="text-sm text-green-800">Teacher Graded Essays</div>
            <div className="text-xs text-green-600 mt-1">Manual grading by teachers</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingEssays}</div>
            <div className="text-sm text-orange-800">Pending Grading</div>
            <div className="text-xs text-orange-600 mt-1">Awaiting teacher review</div>
          </div>
        </div>
      </Card>

      {/* System Alerts */}
      {(stats.unassignedStudents > 0 || stats.pendingEssays > 10) && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">System Alerts</h3>
          </div>
          <div className="space-y-1 text-sm text-yellow-700">
            {stats.unassignedStudents > 0 && (
              <div>• {stats.unassignedStudents} students need teacher assignment</div>
            )}
            {stats.pendingEssays > 10 && (
              <div>• {stats.pendingEssays} essays are pending grading (high volume)</div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -2 }}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
              onClick={action.action}
            >
              <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 flex items-center justify-center mb-3`}>
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{action.description}</p>
              <div className="text-lg font-bold text-gray-900">{action.count}</div>
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Management Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Super Admins</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.totalAdmins}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Teachers</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.totalTeachers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Students</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{stats.totalStudents}</span>
            </div>
            {stats.unassignedStudents > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Unassigned Students</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{stats.unassignedStudents}</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/users')}
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};