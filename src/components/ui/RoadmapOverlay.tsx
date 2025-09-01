'use client';

import React, { useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { roadmapMarkdownToHtml, releaseNotesMarkdownToHtml } from '@/lib/utils';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useModalSwipe } from '@/hooks/useSwipeGestures';

interface RoadmapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: {
    id: string;
    name: string;
    description: string;
    status: string;
    category?: string;
    launchDate?: string;
    featuresAndChanges?: string;
    releaseNotes?: string;
    releaseType?: string;
    application?: string;
    applicationUrl?: string;
    milestone?: string;
  };
}

export default function RoadmapOverlay({ isOpen, onClose, roadmap }: RoadmapOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Use swipe gestures for modal dismissal
  useModalSwipe(modalRef, onClose);

  if (!isOpen) return null;

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      case 'planned':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'in progress':
        return <ClockIcon className="w-6 h-6 text-blue-500 animate-spin-slow" />;
      case 'delayed':
        return <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />;
      case 'planned':
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
      case 'cancelled':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'major':
        return 'bg-red-100 text-red-800';
      case 'minor':
        return 'bg-green-100 text-green-800';
      case 'patch':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {getStatusIcon(roadmap.status)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{roadmap.name}</h2>
                {roadmap.application && (
                  <div className="mt-1">
                    {roadmap.applicationUrl ? (
                      <a 
                        href={roadmap.applicationUrl.startsWith('http') ? roadmap.applicationUrl : `https://${roadmap.applicationUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 
                        bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors duration-200"
                      >
                        {roadmap.application}
                        <svg className="ml-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="inline-flex text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md">
                        {roadmap.application}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{roadmap.description}</p>
            </div>

            {/* Features & Changes */}
            {roadmap.featuresAndChanges && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Changes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 space-y-2">
                    {roadmap.featuresAndChanges.split('\n').map((item: string, index: number) => {
                      const trimmedItem = item.trim();
                      if (!trimmedItem) return null;
                      
                      // Check for indentation (sub-bullets)
                      const originalIndentation = item.length - item.trimStart().length;
                      const isSubBullet = originalIndentation > 0;
                      
                      // Remove bullet points and clean up
                      const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');
                      
                      return (
                        <div key={index} className={`flex items-start ${isSubBullet ? 'ml-6' : ''}`}>
                          <span className={`mr-3 mt-1 flex-shrink-0 ${isSubBullet ? 'text-gray-400' : 'text-blue-500'}`}>
                            {isSubBullet ? '◦' : '•'}
                          </span>
                          <span 
                            className="flex-grow leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: roadmapMarkdownToHtml(cleanedItem) 
                            }}
                          />
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              </div>
            )}

            {/* Release Notes */}
            {roadmap.releaseNotes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Release Notes</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div 
                    className="text-blue-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: releaseNotesMarkdownToHtml(roadmap.releaseNotes) 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(roadmap.status)}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(roadmap.status)}`}>
                    {roadmap.status}
                  </span>
                </div>
              </div>
              
              {roadmap.releaseType && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Release Type</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReleaseTypeColor(roadmap.releaseType)}`}>
                    {roadmap.releaseType}
                  </span>
                </div>
              )}
              
              {roadmap.milestone && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Milestone</h4>
                  <p className="text-gray-900">{roadmap.milestone}</p>
                </div>
              )}
              
              {roadmap.launchDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Launch Date</h4>
                  <p className="text-gray-900">{new Date(roadmap.launchDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 