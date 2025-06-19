import React from 'react';
import { useAuthStore } from '../store/authStore';
import { SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard not available</h2>
              <p className="text-gray-600">Please contact your administrator for access.</p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};