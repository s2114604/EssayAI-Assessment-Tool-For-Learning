import React from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 via-secondary-100/20 to-accent-100/20" />
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            EssayAI
          </h1>
          <p className="text-gray-600">Automated Essay Assessment Platform</p>
        </motion.div>
        <LoginForm />
      </div>
    </div>
  );
};