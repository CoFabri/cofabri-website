'use client';

import { useEffect, useState } from 'react';
import { SystemStatus } from '@/lib/airtable';
import AnimatedGradient from './AnimatedGradient';

interface StatusPageContentProps {
  initialStatuses: SystemStatus[];
}

export function StatusPageContent({ initialStatuses }: StatusPageContentProps) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(300); // 5 minutes in seconds
  const [lastPageUpdate, setLastPageUpdate] = useState(Date.now());

  // Format countdown time
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date consistently
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Date unavailable';
      }
      return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/New_York'
      });
    } catch (e) {
      console.error('Invalid date:', dateString);
      return 'Date unavailable';
    }
  };

  // Format time for Last Updated
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Time unavailable';
      }
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/New_York',
        timeZoneName: 'short'
      });
    } catch (e) {
      console.error('Invalid date:', dateString);
      return 'Time unavailable';
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatuses(data);
        setLastPageUpdate(Date.now());
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    const timer = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        // Only continue countdown if there are active issues
        const hasActiveIssues = statuses.some(status => status.publicStatus !== 'Resolved');
        if (!hasActiveIssues) {
          return 300; // Reset to 5 minutes but don't show countdown
        }
        if (prev <= 1) {
          fetchStatuses();
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Remove statuses dependency to prevent infinite re-renders

  const getStatusColor = (status: SystemStatus) => {
    switch (status.publicStatus) {
      case 'Investigating':
        return 'bg-red-500';
      case 'Identified':
        return 'bg-orange-500';
      case 'Monitoring':
        return 'bg-blue-500';
      case 'Resolved':
        return 'bg-green-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusText = (status: SystemStatus) => {
    if (status.publicStatus === 'Resolved') {
      const resolvedDate = new Date(status['Resolved Date']);
      const now = new Date();
      const minutesAgo = Math.round((now.getTime() - resolvedDate.getTime()) / (1000 * 60));
      if (minutesAgo < 60) {
        return `Resolved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
      }
      const hoursAgo = Math.round(minutesAgo / 60);
      return `Resolved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    }
    return status.publicStatus;
  };

  const getSeverityColor = (severity: SystemStatus['severity']) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[320px] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
        <AnimatedGradient />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">
            System Status
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time status of all CoFabri systems and services. We update this page in real-time with any issues that affect our services.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Status Grid */}
        <div className="grid gap-8">
          {statuses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">All Systems Operational</h2>
              <p className="text-gray-600 text-lg">There are no active issues at this time.</p>
            </div>
          ) : (
            statuses.map((status) => (
              <div key={`status-${status.ticketId || 'unknown'}`} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Status Header */}
                <div className="border-b border-gray-100 p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(status)} ${status.publicStatus !== 'Resolved' ? 'animate-pulse' : ''}`} />
                        <h2 className="text-2xl font-bold text-gray-900">{status.title || 'System Issue'}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(status.severity)}`}>
                          {status.severity || 'Medium'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          Created {formatDate(status['Created Date'])}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        Incident #{status.ticketId || 'Unknown'}
                      </span>
                      {status.application && (
                        <div className="mt-3">
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold text-blue-700">{status.application}</span>
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mt-3">
                        Last Updated: {formatTime(status['Updated At'])}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Content */}
                <div className="p-8">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">{status.message || 'No message available'}</p>
                    
                    {status.affectedServices && status.affectedServices.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Affected Services</h3>
                        <div className="flex flex-wrap gap-3">
                          {status.affectedServices.map((service, index) => (
                            <span
                              key={service || index}
                              className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200"
                            >
                              {service || 'Unknown Service'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {status.updates && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Updates</h3>
                        <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">{status.updates}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Footer */}
                {status.publicStatus === 'Resolved' && (
                  <div className="bg-green-50 px-8 py-6 border-t border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500" />
                      <p className="text-green-800 font-medium">
                        {getStatusText(status)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="text-gray-600 mb-2">Page last updated: {formatDate(new Date(lastPageUpdate).toISOString())}</p>
            {statuses.some(status => status.publicStatus !== 'Resolved') && (
              <p className="text-gray-600">
                Next update in <span className="font-semibold text-blue-600">{formatCountdown(timeUntilRefresh)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 