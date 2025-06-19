import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, AlertTriangle, CheckCircle, BarChart3, Brain, TrendingUp, Info } from 'lucide-react';
import { AIDetectionReport as AIDetectionReportType } from '../../lib/replicate';
import { Card } from '../ui/Card';

interface AIDetectionReportProps {
  report: AIDetectionReportType;
}

export const AIDetectionReport: React.FC<AIDetectionReportProps> = ({ report }) => {
  const getAIProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-600 bg-red-100 border-red-200';
    if (probability >= 0.4) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getAIProbabilityStatus = (probability: number) => {
    if (probability >= 0.7) return { 
      icon: AlertTriangle, 
      text: 'High AI Probability', 
      color: 'text-red-600',
      description: 'Strong indicators of AI-generated content'
    };
    if (probability >= 0.4) return { 
      icon: AlertTriangle, 
      text: 'Moderate AI Probability', 
      color: 'text-yellow-600',
      description: 'Some patterns suggest possible AI involvement'
    };
    return { 
      icon: CheckCircle, 
      text: 'Low AI Probability', 
      color: 'text-green-600',
      description: 'Appears to be human-written content'
    };
  };

  const status = getAIProbabilityStatus(report.ai_probability);
  const StatusIcon = status.icon;

  const aiPercentage = Math.round(report.ai_probability * 100);
  const humanPercentage = Math.round(report.human_probability * 100);
  const confidencePercentage = Math.round(report.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall AI Detection Result */}
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getAIProbabilityColor(report.ai_probability)}`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{aiPercentage}%</div>
              <div className="text-xs opacity-75">AI</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <h3 className="text-xl font-semibold text-gray-900">{status.text}</h3>
        </div>
        <p className="text-gray-600 mb-4">{status.description}</p>
        
        {/* Confidence Level */}
        <div className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Confidence: {confidencePercentage}%
          </span>
        </div>
      </Card>

      {/* Detailed Probability Breakdown */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Brain className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Detection Analysis</h3>
        </div>
        
        {/* Visual Probability Chart */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">AI-Generated Probability</span>
              </div>
              <span className="text-sm font-bold text-red-600">{aiPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${aiPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Human-Written Probability</span>
              </div>
              <span className="text-sm font-bold text-green-600">{humanPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${humanPercentage}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Detection Confidence</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{confidencePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercentage}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`p-4 rounded-lg border-2 ${getAIProbabilityColor(report.ai_probability)}`}>
          <div className="flex items-center space-x-2 mb-2">
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            <h4 className="font-semibold">Risk Assessment</h4>
          </div>
          <p className="text-sm">
            {aiPercentage >= 70 ? 
              'This content shows strong indicators of AI generation. Consider discussing academic integrity with the student.' :
              aiPercentage >= 40 ?
              'This content shows some patterns that could indicate AI assistance. May warrant further investigation.' :
              'This content appears to be primarily human-written with natural language patterns.'
            }
          </p>
        </div>
      </Card>

      {/* Detailed Analysis */}
      {report.analysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {report.analysis}
            </pre>
          </div>
        </Card>
      )}

      {/* Report Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Report Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Status:</span>
            <span className="ml-2 capitalize text-gray-900">{report.status}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Checked on:</span>
            <span className="ml-2 text-gray-900">
              {new Date(report.checked_at).toLocaleDateString()} at {new Date(report.checked_at).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">AI Probability:</span>
            <span className="ml-2 font-bold text-gray-900">{aiPercentage}%</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Detection Method:</span>
            <span className="ml-2 text-gray-900">Replicate AI Detector</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About AI Detection</p>
              <p>This analysis uses advanced machine learning models to identify patterns typical of AI-generated text. While highly accurate, results should be considered alongside other factors when evaluating academic integrity.</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};