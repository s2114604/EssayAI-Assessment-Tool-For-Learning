import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  BookOpen,
  ClipboardCheck,
  Shield,
  UserCheck,
  Edit,
  Award,
  Bot,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const getNavItems = () => {
    const common = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    switch (user?.role) {
      case 'super_admin':
        return [
          ...common,
          { icon: Users, label: 'User Management', path: '/users' },
          { icon: FileText, label: 'All Essays', path: '/essays' },
          { icon: BookOpen, label: 'All Assignments', path: '/assignments' },
          { icon: Users, label: 'All Students', path: '/students' },
          { icon: TrendingUp, label: 'System Reports', path: '/reports' },
          { icon: Shield, label: 'System Settings', path: '/settings' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        ];
      case 'teacher':
        return [
          ...common,
          { icon: BookOpen, label: 'My Assignments', path: '/assignments' },
          { icon: Edit, label: '🎯 Grade Essays', path: '/essays', highlight: true },
          { icon: Users, label: 'My Students', path: '/students' },
          { icon: TrendingUp, label: '📊 Student Reports', path: '/reports', highlight: true },
        ];
      case 'student':
        return [
          ...common,
          { icon: BookOpen, label: 'My Assignments', path: '/assignments' },
          { icon: FileText, label: 'My Submissions', path: '/essays' },
          { icon: ClipboardCheck, label: 'Grades', path: '/grades' },
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-64 bg-white/80 backdrop-blur-lg border-r border-gray-200 fixed left-0 top-16 bottom-0 z-30"
    >
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : item.highlight
                    ? 'text-orange-700 hover:bg-orange-100 bg-orange-50 border border-orange-200 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.highlight && (
                <Award className="w-4 h-4 text-orange-600" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
};