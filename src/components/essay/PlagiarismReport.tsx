import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { PlagiarismReport as PlagiarismReportType } from '../../types';
import { Card } from '../ui/Card';

interface PlagiarismReportProps {
  report: PlagiarismReportType;
}

export const PlagiarismReport: React.FC<PlagiarismReportProps> = ({ report }) => {
  const getSimilarityColor = (percentage: number) => {
    if (percentage < 10) return 'text-green-600 bg-green-100';
    if (percentage < 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSimilarityStatus = (percentage: number) => {
    if (percentage < 10) return { icon: CheckCircle, text: 'Low Risk', color: 'text-green-600' };
    if (percentage < 25) return { icon: AlertTriangle, text: 'Medium Risk', color: 'text-yellow-600' };
    return { icon: AlertTriangle, text: 'High Risk', color: 'text-red-600' };
  };

  const status = getSimilarityStatus(report.similarity_percentage);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall Similarity */}
      <Card className="p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getSimilarityColor(report.similarity_percentage)}`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{report.similarity_percentage}%</div>
              <div className="text-xs opacity-75">Similar</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <h3 className="text-xl font-semibold text-gray-900">{status.text}</h3>
        </div>
        <p className="text-gray-600">
          Overall similarity detected in submitted content
        </p>
      </Card>

      {/* Source Matches */}
      {report.sources.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Source Matches</h3>
          </div>
          
          <div className="space-y-4">
            {report.sources.map((source) => (
              <div key={source.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{source.title}</h4>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <span className="truncate">{source.url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(source.similarity_percentage)}`}>
                    {source.similarity_percentage}%
                  </span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Matched text:</p>
                  <p className="text-sm text-gray-800 italic">"{source.matched_text}"</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h3>
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
            <span className="font-medium text-gray-600">Sources found:</span>
            <span className="ml-2 text-gray-900">{report.sources.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Detection method:</span>
            <span className="ml-2 text-gray-900">AI-powered analysis</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};