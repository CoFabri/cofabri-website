'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { roadmapMarkdownToHtml, releaseNotesMarkdownToHtml } from '@/lib/utils';
import { roadmapStatusPillClasses, displayAppName } from '@/lib/roadmap-display';
import { RoadmapFeature } from '@/lib/api-client';

interface RoadmapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: RoadmapFeature;
  appNames?: Record<string, string>;
}

export default function RoadmapOverlay({ isOpen, onClose, roadmap, appNames = {} }: RoadmapOverlayProps) {
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

  if (!isOpen) return null;

  const hasBodyContent = Boolean(roadmap.description || roadmap.featuresAndChanges || roadmap.releaseNotes);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-border p-6">
            <div>
              <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roadmapStatusPillClasses(roadmap.status)}`}>
                  {roadmap.status}
                </span>
                {roadmap.application && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                    {displayAppName(roadmap.application, appNames)}
                  </span>
                )}
              </div>
              <h2 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">{roadmap.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:bg-muted hover:text-foreground"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-104px)] overflow-y-auto p-6">
            {roadmap.description && (
              <p className="m-0 text-base leading-relaxed text-ink-body">{roadmap.description}</p>
            )}

            {/* Features & Changes — only populated once cofabri-api exposes this field */}
            {roadmap.featuresAndChanges && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Features &amp; changes</h3>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <div className="space-y-2 text-sm text-ink-body">
                    {roadmap.featuresAndChanges.split('\n').map((item: string, index: number) => {
                      const trimmedItem = item.trim();
                      if (!trimmedItem) return null;

                      const originalIndentation = item.length - item.trimStart().length;
                      const isSubBullet = originalIndentation > 0;
                      const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');

                      return (
                        <div key={index} className={`flex items-start ${isSubBullet ? 'ml-6' : ''}`}>
                          <span className={`mr-3 mt-1 flex-shrink-0 ${isSubBullet ? 'text-ink-faint' : 'text-primary'}`}>
                            {isSubBullet ? '◦' : '•'}
                          </span>
                          <span
                            className="flex-grow leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: roadmapMarkdownToHtml(cleanedItem) }}
                          />
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              </div>
            )}

            {/* Release notes — only populated once cofabri-api exposes this field */}
            {roadmap.releaseNotes && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Release notes</h3>
                <div className="rounded-lg border border-accent bg-accent p-4">
                  <div
                    className="leading-relaxed text-accent-foreground"
                    dangerouslySetInnerHTML={{ __html: releaseNotesMarkdownToHtml(roadmap.releaseNotes) }}
                  />
                </div>
              </div>
            )}

            <div className={`flex flex-wrap gap-x-8 gap-y-4 ${hasBodyContent ? 'mt-6 border-t border-border pt-6' : ''}`}>
              {roadmap.milestone && (
                <div>
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Milestone</div>
                  <div className="text-sm text-foreground">{roadmap.milestone}</div>
                </div>
              )}
              {roadmap.releasedDate && (
                <div>
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Released</div>
                  <div className="text-sm text-foreground">{new Date(roadmap.releasedDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
