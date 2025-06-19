import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, Mail, Phone, Calendar, BookOpen } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { UserForm } from './UserForm';
import { useUserStore } from '../../store/userStore';
import { User } from '../../types';
import toast from 'react-hot-toast';

export const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { users, addUser, updateUser, deleteUser, getUsersByRole, loadUsers, isLoading } = useUserStore();
  const teachers = getUsersByRole('teacher');

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleFormSubmit = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, userData);
        toast.success('User updated successfully');
      } else {
        await addUser(userData);
        toast.success('User created successfully');
      }
      setShowUserForm(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <UserCheck className="w-4 h-4" />;
      case 'teacher': return <BookOpen className="w-4 h-4" />;
      case 'student': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.full_name : 'Unknown Teacher';
  };

  const getStudentsByTeacher = (teacherId: string) => {
    return users.filter(user => user.role === 'student' && user.teacher_id === teacherId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTeacher = filterTeacher === 'all' || 
                          (user.role === 'student' && user.teacher_id === filterTeacher) ||
                          (user.role === 'teacher' && user.id === filterTeacher);
    return matchesSearch && matchesRole && matchesTeacher;
  });

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'super_admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length,
    unassignedStudents: users.filter(u => u.role === 'student' && !u.teacher_id).length,
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
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
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button variant="primary" onClick={handleAddUser} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{userStats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
          <div className="text-sm text-gray-600">Administrators</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.teachers}</div>
          <div className="text-sm text-gray-600">Teachers</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.students}</div>
          <div className="text-sm text-gray-600">Students</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{userStats.unassignedStudents}</div>
          <div className="text-sm text-gray-600">Unassigned</div>
        </Card>
      </div>

      {/* Teacher-Student Overview */}
      {teachers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher-Student Assignments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => {
              const assignedStudents = getStudentsByTeacher(teacher.id);
              return (
                <div key={teacher.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{teacher.full_name}</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} assigned
                  </div>
                  {assignedStudents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {assignedStudents.slice(0, 3).map((student) => (
                        <div key={student.id} className="text-xs text-blue-600">
                          • {student.full_name}
                        </div>
                      ))}
                      {assignedStudents.length > 3 && (
                        <div className="text-xs text-blue-500">
                          +{assignedStudents.length - 3} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            {teachers.length > 0 && (
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({getStudentsByTeacher(teacher.id).length} students)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'student' ? (
                      user.teacher_id ? (
                        <div className="flex items-center text-sm text-blue-600">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {getTeacherName(user.teacher_id)}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Unassigned
                        </span>
                      )
                    ) : user.role === 'teacher' ? (
                      <div className="text-sm text-gray-600">
                        {getStudentsByTeacher(user.id).length} student{getStudentsByTeacher(user.id).length !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="w-4 h-4 mr-1" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        {user.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterRole !== 'all' || filterTeacher !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first user'}
            </p>
            <Button variant="primary" onClick={handleAddUser}>
              Add First User
            </Button>
          </div>
        )}
      </Card>

      {/* User Form Modal */}
      <Modal
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          isLoading={isLoading}
        />
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
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete this user? This action cannot be undone.
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
              onClick={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)}
              loading={isLoading}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};