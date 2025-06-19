import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Shield, BookOpen, Users, Edit, Save, X, Camera, Key, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { updateUser, isLoading } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar_url: user?.avatar_url || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters';
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm() || !user) return;

    try {
      await updateUser(user.id, formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword() || !user) return;

    try {
      // In a real app, you would verify the current password first
      await updateUser(user.id, { password: passwordData.new_password });
      setShowPasswordChange(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar_url: user?.avatar_url || '',
    });
    setIsEditing(false);
    setShowPasswordChange(false);
    setErrors({});
  };

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'super_admin':
        return {
          title: 'Super Administrator',
          description: 'Full system access and user management',
          icon: Shield,
          color: 'text-red-600 bg-red-100',
          permissions: [
            'Manage all users and accounts',
            'Access system-wide analytics',
            'Configure platform settings',
            'View all essays and assignments',
            'Manage teacher-student assignments'
          ]
        };
      case 'teacher':
        return {
          title: 'Teacher',
          description: 'Manage students and grade assignments',
          icon: BookOpen,
          color: 'text-blue-600 bg-blue-100',
          permissions: [
            'Create and manage assignments',
            'Grade student essays with AI assistance',
            'View assigned student progress',
            'Generate student reports',
            'Manage classroom activities'
          ]
        };
      case 'student':
        return {
          title: 'Student',
          description: 'Submit essays and view grades',
          icon: Users,
          color: 'text-green-600 bg-green-100',
          permissions: [
            'Submit essays for assignments',
            'View detailed AI feedback',
            'Track assignment progress',
            'Access grade history',
            'Communicate with assigned teacher'
          ]
        };
      default:
        return {
          title: 'User',
          description: 'Platform user',
          icon: User,
          color: 'text-gray-600 bg-gray-100',
          permissions: []
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
        </div>
        {!isEditing && (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                <RoleIcon className="w-4 h-4 mr-1" />
                {roleInfo.title}
              </span>
              <span className="text-sm text-gray-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                    loading={isLoading}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                icon={<User className="w-4 h-4 text-gray-400" />}
                disabled={!isEditing}
                error={errors.full_name}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                disabled={!isEditing}
                error={errors.email}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                disabled={!isEditing}
                error={errors.phone}
                placeholder="(555) 123-4567"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? 'bg-gray-50' : ''}`}
                    rows={2}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </Button>
              </div>
            )}

            {showPasswordChange && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <h4 className="text-md font-medium text-gray-900">Change Password</h4>
                
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                  error={errors.current_password}
                  required
                />
                
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                  error={errors.new_password}
                  required
                />
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                  error={errors.confirm_password}
                  required
                />
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                      setErrors({});
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    loading={isLoading}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Update Password
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Role Information */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2 mb-2">
                  <RoleIcon className={`w-5 h-5 ${roleInfo.color.split(' ')[0]}`} />
                  <h4 className="font-medium text-gray-900">{roleInfo.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{roleInfo.description}</p>
                <div className="text-xs text-gray-500">
                  Account type cannot be changed. Contact an administrator for role changes.
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Account Permissions</h4>
                <ul className="space-y-2">
                  {roleInfo.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Account created: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: {new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Teacher-specific or Student-specific info */}
          {user.role === 'student' && user.teacher_id && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Assignment</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Your Teacher</h4>
                </div>
                <p className="text-sm text-blue-700">
                  You are assigned to <strong>{getUserTeacherName(user.teacher_id)}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Contact your teacher for assignment help and feedback
                </p>
              </div>
            </Card>
          )}

          {user.role === 'teacher' && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Information</h3>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Your Students</h4>
                </div>
                <p className="text-sm text-blue-700">
                  You have <strong>{getTeacherStudentCount(user.id)}</strong> students assigned to you
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/students')}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Students
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Helper function to get teacher name
  function getUserTeacherName(teacherId: string): string {
    const { getUserById } = useUserStore();
    const teacher = getUserById(teacherId);
    return teacher?.full_name || 'Unknown Teacher';
  }

  // Helper function to get student count
  function getTeacherStudentCount(teacherId: string): number {
    const { users } = useUserStore();
    return users.filter(u => u.role === 'student' && u.teacher_id === teacherId).length;
  }

  // Helper function for navigation
  function navigate(path: string) {
    window.location.href = path;
  }
};