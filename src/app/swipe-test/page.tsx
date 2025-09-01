'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TouchButton from '@/components/ui/TouchButton';
import TouchLink from '@/components/ui/TouchLink';
import SwipeableCarousel from '@/components/ui/SwipeableCarousel';
import RoadmapOverlay from '@/components/ui/RoadmapOverlay';

const SwipeTestPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sample roadmap data for testing
  const sampleRoadmap = {
    id: 'test-1',
    name: 'Swipe Gestures Feature',
    description: 'This is a test roadmap item to demonstrate swipe-to-dismiss functionality in modals.',
    status: 'In Progress',
    category: 'Mobile Experience',
    launchDate: '2024-12-01',
    featuresAndChanges: `
• Swipe-to-open mobile navigation
• Swipe-to-dismiss modals and popups
• Swipe navigation for carousels
• Haptic feedback for swipe actions
• Touch-friendly interactions
• Mobile-optimized animations
    `,
    releaseNotes: 'Enhanced mobile user experience with intuitive swipe gestures.',
    releaseType: 'Minor',
    application: 'CoFabri Platform',
    applicationUrl: 'https://cofabri.com',
    milestone: 'Mobile UX Enhancement',
  };

  // Sample carousel items
  const carouselItems = [
    <div key="1" className="bg-gradient-to-br from-blue-500 to-purple-600 h-64 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
      Slide 1 - Swipe Right
    </div>,
    <div key="2" className="bg-gradient-to-br from-green-500 to-teal-600 h-64 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
      Slide 2 - Swipe Left
    </div>,
    <div key="3" className="bg-gradient-to-br from-orange-500 to-red-600 h-64 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
      Slide 3 - Swipe Both Ways
    </div>,
    <div key="4" className="bg-gradient-to-br from-pink-500 to-indigo-600 h-64 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
      Slide 4 - Touch Friendly
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Swipe Gestures Test</h1>
          <p className="text-lg text-gray-600 mb-8">
            Test the swipe gesture functionality across different components
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mobile Navigation Test */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mobile Navigation</h2>
            <p className="text-gray-600 mb-4">
              Test swipe-to-open mobile navigation. On mobile devices, swipe right from the left edge to open the menu.
            </p>
            <div className="space-y-3">
              <TouchButton
                variant="primary"
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-full"
              >
                Open Mobile Menu
              </TouchButton>
              <p className="text-sm text-gray-500">
                💡 Tip: Try swiping right from the left edge of the screen on mobile
              </p>
            </div>
          </motion.div>

          {/* Modal Dismissal Test */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modal Dismissal</h2>
            <p className="text-gray-600 mb-4">
              Test swipe-to-dismiss functionality. Open the modal and try swiping up or down to dismiss it.
            </p>
            <div className="space-y-3">
              <TouchButton
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                className="w-full"
              >
                Open Modal
              </TouchButton>
              <p className="text-sm text-gray-500">
                💡 Tip: Swipe up or down on the modal to dismiss it
              </p>
            </div>
          </motion.div>

          {/* Carousel Navigation Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Carousel Navigation</h2>
            <p className="text-gray-600 mb-4">
              Test swipe navigation in the carousel. Swipe left or right to navigate between slides.
            </p>
            <div className="h-64 rounded-lg overflow-hidden">
              <SwipeableCarousel
                items={carouselItems}
                autoPlay={false}
                showArrows={true}
                showDots={true}
                className="h-full"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3">
              💡 Tip: Swipe left or right on the carousel to navigate between slides
            </p>
          </motion.div>

          {/* Gesture Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-blue-50 rounded-xl p-6 lg:col-span-2"
          >
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Swipe Gesture Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Mobile Navigation</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Swipe right from left edge → Open mobile menu</li>
                  <li>• Swipe left on open menu → Close mobile menu</li>
                  <li>• Minimum swipe distance: 60px</li>
                  <li>• Maximum swipe time: 400ms</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Modal Dismissal</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Swipe up or down → Dismiss modal</li>
                  <li>• Minimum swipe distance: 80px</li>
                  <li>• Maximum swipe time: 500ms</li>
                  <li>• Works on any modal or popup</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Carousel Navigation</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Swipe left → Next slide</li>
                  <li>• Swipe right → Previous slide</li>
                  <li>• Minimum swipe distance: 50px</li>
                  <li>• Maximum swipe time: 300ms</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Haptic Feedback</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>• Light vibration on successful swipe</li>
                  <li>• Works on iOS and Android</li>
                  <li>• Respects user preferences</li>
                  <li>• Enhances touch feedback</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="lg:col-span-2 text-center"
          >
            <TouchLink
              href="/"
              variant="primary"
              size="large"
              className="inline-flex"
            >
              Back to Home
            </TouchLink>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden">
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Test Mobile Menu</h2>
              <TouchButton
                variant="icon"
                size="medium"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </TouchButton>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                This is a test mobile menu. Try swiping left to close it.
              </p>
              <TouchButton
                variant="primary"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full"
              >
                Close Menu
              </TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Modal */}
      <RoadmapOverlay
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roadmap={sampleRoadmap}
      />
    </div>
  );
};

export default SwipeTestPage;
