import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, User as UserIcon, Phone, MapPin, Users, Lock } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

interface UserFormProps {
  user?: User | null;
  onSubmit: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { getUsersByRole } = useUserStore();
  const teachers = getUsersByRole('teacher');

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student' as User['role'],
    phone: '',
    address: '',
    avatar_url: '',
    teacher_id: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatar_url: user.avatar_url || '',
        teacher_id: user.teacher_id || '',
        password: '', // Don't pre-fill password for security
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Password is required for new users, optional for updates
    if (!user && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // If creating a student, teacher assignment is required
    if (formData.role === 'student' && !formData.teacher_id && teachers.length > 0) {
      newErrors.teacher_id = 'Please assign this student to a teacher';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Don't include teacher_id for non-student roles
    const submitData = { ...formData };
    if (formData.role !== 'student') {
      delete submitData.teacher_id;
    }

    // Don't include empty password for updates
    if (user && !formData.password.trim()) {
      delete submitData.password;
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAssignedTeacher = () => {
    if (formData.teacher_id) {
      const teacher = teachers.find(t => t.id === formData.teacher_id);
      return teacher?.full_name || 'Unknown Teacher';
    }
    return 'No teacher assigned';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          icon={<UserIcon className="w-4 h-4 text-gray-400" />}
          error={errors.full_name}
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          icon={<Mail className="w-4 h-4 text-gray-400" />}
          error={errors.email}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="super_admin">Super Admin</option>
          </select>
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
        </div>

        <Input
          label={user ? "New Password (leave blank to keep current)" : "Password"}
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          icon={<Lock className="w-4 h-4 text-gray-400" />}
          error={errors.password}
          required={!user}
          placeholder={user ? "Enter new password..." : "Enter password..."}
        />
      </div>

      <Input
        label="Phone Number"
        type="tel"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        icon={<Phone className="w-4 h-4 text-gray-400" />}
        placeholder="(555) 123-4567"
      />

      {/* Teacher Assignment for Students */}
      {formData.role === 'student' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Teacher {teachers.length > 0 && <span className="text-red-500">*</span>}
          </label>
          {teachers.length > 0 ? (
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.teacher_id}
                onChange={(e) => handleChange('teacher_id', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={teachers.length > 0}
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No teachers available. Please create a teacher account first before assigning students.
              </p>
            </div>
          )}
          {errors.teacher_id && <p className="mt-1 text-sm text-red-600">{errors.teacher_id}</p>}
        </div>
      )}

      {/* Show current assignment for existing students */}
      {user && user.role === 'student' && user.teacher_id && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Currently assigned to: {getAssignedTeacher()}
            </span>
          </div>
        </div>
      )}

      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
        icon={<MapPin className="w-4 h-4 text-gray-400" />}
        placeholder="123 Main St, City, State 12345"
      />

      <Input
        label="Avatar URL"
        type="url"
        value={formData.avatar_url}
        onChange={(e) => handleChange('avatar_url', e.target.value)}
        placeholder="https://example.com/avatar.jpg"
      />

      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};