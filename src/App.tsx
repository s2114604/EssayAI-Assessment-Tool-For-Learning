import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Essays } from './pages/Essays';
import { Assignments } from './pages/Assignments';
import { Students } from './pages/Students';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';

function App() {
  const { user, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!user) {
    return (
      <>
        <Login />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assignments" element={<Assignments />} />
          
          {/* Essays page for ALL users */}
          <Route path="/essays" element={<Essays />} />
          
          {/* Keep My Essays page only for students */}
          {user.role === 'student' && <Route path="/my-essays" element={<Essays />} />}
          
          {/* Students page only for teachers and super admins */}
          {(user.role === 'teacher' || user.role === 'super_admin') && (
            <Route path="/students" element={<Students />} />
          )}
          
          <Route path="/reports" element={<Reports />} />
          <Route path="/grades" element={<div className="p-8 text-center text-gray-500">Grades page coming soon...</div>} />
          
          {/* User management only for super admins */}
          {user.role === 'super_admin' && <Route path="/users" element={<UserManagement />} />}
          
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<div className="p-8 text-center text-gray-500">Analytics page coming soon...</div>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;