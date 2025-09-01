'use client';

import { useState, useCallback } from 'react';
import PullToRefreshWrapper from '@/components/ui/PullToRefreshWrapper';
import GradientHeading from '@/components/ui/GradientHeading';

export default function PullToRefreshTestPage() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRefreshCount(prev => prev + 1);
    setLastRefresh(new Date());
  }, []);

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} className="min-h-screen">
      <GradientHeading
        title="Pull to Refresh Test"
        subtitle="Pull down from the top to test the refresh functionality"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Results</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Refresh Count:</span>
                <span className="text-blue-900 font-bold text-xl">{refreshCount}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">Last Refresh:</span>
                <span className="text-green-900 font-medium">
                  {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Test:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>On mobile: Pull down from the top of the screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>On desktop: Use touch gestures or scroll wheel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Release when you see "Release to refresh"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Watch the refresh count increase</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Features Demonstrated:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Visual pull indicator with progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Smooth animations and transitions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Loading spinner during refresh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Touch gesture handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Error handling and state management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PullToRefreshWrapper>
  );
}
