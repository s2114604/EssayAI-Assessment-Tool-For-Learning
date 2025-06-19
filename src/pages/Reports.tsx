import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Bot,
  Star,
  Target,
  BookOpen,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useEssayStore } from '../store/essayStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { useNavigate } from 'react-router-dom';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { users, loadUsers } = useUserStore();
  const { essays, loadTeacherEssays } = useEssayStore();
  const { assignments, loadTeacherAssignments } = useAssignmentStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          await Promise.all([
            loadUsers(),
            loadTeacherEssays(user.id),
            loadTeacherAssignments(user.id)
          ]);
        } catch (error) {
          console.error('Error loading reports data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user?.id, loadUsers, loadTeacherEssays, loadTeacherAssignments]);

  // Get students assigned to this teacher
  const myStudents = users.filter(u => u.role === 'student' && u.teacher_id === user?.id);

  // Filter students based on search
  const filteredStudents = myStudents.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate comprehensive analytics
  const getStudentAnalytics = (studentId: string) => {
    const studentEssays = essays.filter(e => e.student_id === studentId);
    const gradedEssays = studentEssays.filter(e => e.grade);
    const aiGradedEssays = gradedEssays.filter(e => e.grade?.graded_by === 'ai');
    const teacherGradedEssays = gradedEssays.filter(e => e.grade?.graded_by === 'teacher');
    const aiDetectedEssays = studentEssays.filter(e => e.ai_detection_report);
    const plagiarismCheckedEssays = studentEssays.filter(e => e.plagiarism_report);

    const averageGrade = gradedEssays.length > 0 
      ? Math.round(gradedEssays.reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / gradedEssays.length)
      : 0;

    const averageAIProbability = aiDetectedEssays.length > 0
      ? aiDetectedEssays.reduce((sum, e) => sum + (e.ai_detection_report?.ai_probability || 0), 0) / aiDetectedEssays.length
      : 0;

    const averagePlagiarismScore = plagiarismCheckedEssays.length > 0
      ? Math.round(plagiarismCheckedEssays.reduce((sum, e) => sum + (e.plagiarism_report?.similarity_percentage || 0), 0) / plagiarismCheckedEssays.length)
      : 0;

    // Calculate criteria averages
    const criteriaAverages = {
      grammar: 0,
      cohesion: 0,
      sentence_structure: 0,
      tone: 0,
      organization: 0
    };

    if (gradedEssays.length > 0) {
      Object.keys(criteriaAverages).forEach(criterion => {
        const total = gradedEssays.reduce((sum, e) => {
          return sum + (e.grade?.criteria_scores?.[criterion as keyof typeof criteriaAverages] || 0);
        }, 0);
        criteriaAverages[criterion as keyof typeof criteriaAverages] = Math.round(total / gradedEssays.length);
      });
    }

    return {
      totalEssays: studentEssays.length,
      gradedEssays: gradedEssays.length,
      aiGradedEssays: aiGradedEssays.length,
      teacherGradedEssays: teacherGradedEssays.length,
      averageGrade,
      criteriaAverages,
      aiDetectedEssays: aiDetectedEssays.length,
      averageAIProbability,
      plagiarismCheckedEssays: plagiarismCheckedEssays.length,
      averagePlagiarismScore,
      recentSubmissions: studentEssays.slice(0, 5),
      lastSubmission: studentEssays.length > 0 ? studentEssays[0] : null
    };
  };

  // Overall class analytics
  const classAnalytics = {
    totalStudents: myStudents.length,
    totalSubmissions: essays.length,
    totalGraded: essays.filter(e => e.grade).length,
    classAverage: essays.filter(e => e.grade).length > 0 
      ? Math.round(essays.filter(e => e.grade).reduce((sum, e) => sum + (e.grade?.total_score || 0), 0) / essays.filter(e => e.grade).length)
      : 0,
    aiDetectionCount: essays.filter(e => e.ai_detection_report).length,
    plagiarismCheckCount: essays.filter(e => e.plagiarism_report).length,
    highRiskAI: essays.filter(e => e.ai_detection_report && e.ai_detection_report.ai_probability >= 0.7).length,
    mediumRiskAI: essays.filter(e => e.ai_detection_report && e.ai_detection_report.ai_probability >= 0.4 && e.ai_detection_report.ai_probability < 0.7).length,
    lowRiskAI: essays.filter(e => e.ai_detection_report && e.ai_detection_report.ai_probability < 0.4).length,
    highPlagiarism: essays.filter(e => e.plagiarism_report && e.plagiarism_report.similarity_percentage >= 25).length,
    mediumPlagiarism: essays.filter(e => e.plagiarism_report && e.plagiarism_report.similarity_percentage >= 10 && e.plagiarism_report.similarity_percentage < 25).length,
    lowPlagiarism: essays.filter(e => e.plagiarism_report && e.plagiarism_report.similarity_percentage < 10).length,
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAIRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPlagiarismColor = (percentage: number) => {
    if (percentage >= 25) return 'text-red-600';
    if (percentage >= 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPerformanceLevel = (avgGrade: number) => {
    if (avgGrade >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (avgGrade >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (avgGrade >= 70) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800' };
    if (avgGrade > 0) return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    return { label: 'No Grades', color: 'bg-gray-100 text-gray-800' };
  };

  const generateRecommendations = (analytics: any) => {
    const recommendations = [];
    
    if (analytics.averageGrade < 70 && analytics.averageGrade > 0) {
      recommendations.push('Focus on fundamental writing skills improvement');
    }
    if (analytics.criteriaAverages.grammar < 15) {
      recommendations.push('Provide additional grammar and mechanics practice');
    }
    if (analytics.criteriaAverages.organization < 15) {
      recommendations.push('Work on essay structure and organization');
    }
    if (analytics.averageAIProbability > 0.5) {
      recommendations.push('Discuss academic integrity and original writing');
    }
    if (analytics.averagePlagiarismScore > 15) {
      recommendations.push('Review proper citation and paraphrasing techniques');
    }
    if (analytics.totalEssays < 3) {
      recommendations.push('Encourage more frequent writing practice');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue excellent work and maintain current standards');
    }
    
    return recommendations;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Reports are only available for teachers.</p>
        </div>
      </div>
    );
  }

  if (selectedStudent) {
    const student = myStudents.find(s => s.id === selectedStudent);
    const analytics = getStudentAnalytics(selectedStudent);
    const recommendations = generateRecommendations(analytics);
    const performance = getPerformanceLevel(analytics.averageGrade);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedStudent(null)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Back to Class Overview</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student?.full_name} - Detailed Report</h1>
              <p className="text-gray-600">{student?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${performance.color}`}>
              {performance.label}
            </span>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Student Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className={`text-3xl font-bold ${getGradeColor(analytics.averageGrade)}`}>
              {analytics.averageGrade > 0 ? `${analytics.averageGrade}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Average Grade</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.gradedEssays} graded essays
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.totalEssays}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.aiGradedEssays} AI, {analytics.teacherGradedEssays} manual
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className={`text-3xl font-bold ${getAIRiskColor(analytics.averageAIProbability)}`}>
              {analytics.aiDetectedEssays > 0 ? `${Math.round(analytics.averageAIProbability * 100)}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Avg AI Probability</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.aiDetectedEssays} essays analyzed
            </div>
          </Card>
          <Card className="p-6 text-center">
            <div className={`text-3xl font-bold ${getPlagiarismColor(analytics.averagePlagiarismScore)}`}>
              {analytics.plagiarismCheckedEssays > 0 ? `${analytics.averagePlagiarismScore}%` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Avg Plagiarism</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.plagiarismCheckedEssays} essays checked
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Criteria Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Criteria</h3>
            <div className="space-y-4">
              {Object.entries(analytics.criteriaAverages).map(([criterion, score]) => (
                <div key={criterion} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {criterion.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 18 ? 'bg-green-500' :
                          score >= 15 ? 'bg-blue-500' :
                          score >= 12 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(score / 20) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${getGradeColor((score / 20) * 100)}`}>
                      {score}/20
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
          <div className="space-y-4">
            {analytics.recentSubmissions.map((essay: any) => (
              <div key={essay.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{essay.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(essay.submitted_at).toLocaleDateString()}</span>
                    </span>
                    {essay.grade && (
                      <span className="flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span className={getGradeColor(essay.grade.total_score)}>
                          {essay.grade.total_score}%
                        </span>
                      </span>
                    )}
                    {essay.ai_detection_report && (
                      <span className="flex items-center space-x-1">
                        <Brain className="w-3 h-3" />
                        <span className={getAIRiskColor(essay.ai_detection_report.ai_probability)}>
                          AI: {Math.round(essay.ai_detection_report.ai_probability * 100)}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/essays')}
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
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
          <h1 className="text-3xl font-bold text-gray-900">Class Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of your {myStudents.length} student{myStudents.length !== 1 ? 's' : ''} performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export All Reports</span>
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/essays')}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Grade Essays</span>
          </Button>
        </div>
      </div>

      {/* Class Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{classAnalytics.totalStudents}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{classAnalytics.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {Math.round((classAnalytics.totalGraded / classAnalytics.totalSubmissions) * 100) || 0}%
          </div>
          <div className="text-sm text-gray-600">Grading Complete</div>
        </Card>
        <Card className="p-6 text-center">
          <div className={`text-3xl font-bold ${getGradeColor(classAnalytics.classAverage)}`}>
            {classAnalytics.classAverage > 0 ? `${classAnalytics.classAverage}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Class Average</div>
        </Card>
      </div>

      {/* AI & Plagiarism Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Content Detection Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High Risk (70%+ AI)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${classAnalytics.aiDetectionCount > 0 ? (classAnalytics.highRiskAI / classAnalytics.aiDetectionCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-red-600">{classAnalytics.highRiskAI}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium Risk (40-70% AI)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-yellow-500 rounded-full"
                    style={{ width: `${classAnalytics.aiDetectionCount > 0 ? (classAnalytics.mediumRiskAI / classAnalytics.aiDetectionCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-yellow-600">{classAnalytics.mediumRiskAI}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Low Risk (&lt;40% AI)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${classAnalytics.aiDetectionCount > 0 ? (classAnalytics.lowRiskAI / classAnalytics.aiDetectionCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-green-600">{classAnalytics.lowRiskAI}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {classAnalytics.aiDetectionCount} of {classAnalytics.totalSubmissions} essays analyzed
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plagiarism Detection Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High Similarity (25%+)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${classAnalytics.plagiarismCheckCount > 0 ? (classAnalytics.highPlagiarism / classAnalytics.plagiarismCheckCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-red-600">{classAnalytics.highPlagiarism}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium Similarity (10-25%)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-yellow-500 rounded-full"
                    style={{ width: `${classAnalytics.plagiarismCheckCount > 0 ? (classAnalytics.mediumPlagiarism / classAnalytics.plagiarismCheckCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-yellow-600">{classAnalytics.mediumPlagiarism}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Low Similarity (&lt;10%)</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${classAnalytics.plagiarismCheckCount > 0 ? (classAnalytics.lowPlagiarism / classAnalytics.plagiarismCheckCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-green-600">{classAnalytics.lowPlagiarism}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {classAnalytics.plagiarismCheckCount} of {classAnalytics.totalSubmissions} essays checked
              </span>
            </div>
          </div>
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
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="week">Last Week</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student Performance List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance Overview</h3>
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const analytics = getStudentAnalytics(student.id);
            const performance = getPerformanceLevel(analytics.averageGrade);
            
            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedStudent(student.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{student.full_name}</h4>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getGradeColor(analytics.averageGrade)}`}>
                      {analytics.averageGrade > 0 ? `${analytics.averageGrade}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Avg Grade</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{analytics.totalEssays}</div>
                    <div className="text-xs text-gray-500">Essays</div>
                  </div>
                  
                  {analytics.aiDetectedEssays > 0 && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getAIRiskColor(analytics.averageAIProbability)}`}>
                        {Math.round(analytics.averageAIProbability * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">AI Risk</div>
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${performance.color}`}>
                    {performance.label}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Report</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'No students assigned to you yet'}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};