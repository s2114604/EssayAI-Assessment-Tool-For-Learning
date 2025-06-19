import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Database, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { diagnostic, DiagnosticResult } from '../../lib/database-diagnostic';
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const { signIn, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      console.log('🔐 Attempting login for:', email);
      await signIn(email.trim(), password);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show specific error message
      if (error.message.includes('Database connection failed') || error.message.includes('Database query failed')) {
        toast.error('Database connection issue. Please check your configuration.');
        setShowDiagnostic(true);
      } else if (error.message.includes('Invalid email or password')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const runDiagnostic = async () => {
    setRunningDiagnostic(true);
    try {
      const results = await diagnostic.runFullDiagnostic();
      setDiagnosticResults(results);
      
      // If user provided credentials, test them specifically
      if (email && password) {
        const loginTest = await diagnostic.testSpecificLogin(email.trim(), password);
        setDiagnosticResults(prev => [...prev, loginTest]);
      }
    } catch (error) {
      console.error('Diagnostic failed:', error);
      toast.error('Diagnostic failed to run');
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const getDemoCredentials = () => [
    { email: 'admin@school.edu', password: 'password123', role: 'Super Admin' },
    { email: 'teacher@school.edu', password: 'demo123', role: 'Teacher' },
    { email: 'student@school.edu', password: 'demo123', role: 'Student' },
    { email: 'tech@gmail.com', password: 'Abiha@2104', role: 'Teacher' },
    { email: 'abiha@gmail.com', password: 'Abiha@2104', role: 'Student' }
  ];

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-gray-400" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-3">🔑 Your Database Accounts</h3>
          <div className="space-y-2">
            {getDemoCredentials().map((demo, index) => (
              <button
                key={index}
                onClick={() => fillDemoCredentials(demo.email, demo.password)}
                className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-blue-900">{demo.role}</div>
                <div className="text-blue-700">{demo.email} / {demo.password}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            ✅ These are the exact credentials from your database
          </div>
        </div>

        {/* Database Diagnostic */}
        {showDiagnostic && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-medium text-yellow-900">Connection Issues Detected</h3>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              There seems to be a problem with the database connection. Run a diagnostic to identify the issue.
            </p>
            <Button
              onClick={runDiagnostic}
              loading={runningDiagnostic}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              Run Database Diagnostic
            </Button>
          </div>
        )}

        {/* Diagnostic Results */}
        {diagnosticResults.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Diagnostic Results</h3>
            <div className="space-y-2">
              {diagnosticResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    {result.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {result.status === 'fail' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {result.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{result.test}</div>
                    <div className="text-xs text-gray-600">{result.message}</div>
                    {result.details && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};