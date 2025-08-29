'use client';

import React from 'react';
import { 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  PhoneIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import GradientHeading from '@/components/ui/GradientHeading';
import SupportForm from '@/components/ui/SupportForm';

export default function SupportPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GradientHeading
        title="Support Center"
        subtitle="We're here to help you succeed with our products and services"
      />

      <div className="container mx-auto px-4 mt-16">
        {/* Quick Actions Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Knowledge Base</h3>
            </div>
            <p className="text-gray-600 mb-4">Browse our comprehensive documentation and guides.</p>
            <a href="/knowledge-base" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              Visit Knowledge Base <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <ExclamationCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            </div>
            <p className="text-gray-600 mb-4">Check if there are any ongoing issues with our services.</p>
            <a href="/status" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              Check Status <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Us</h3>
            </div>
            <p className="text-gray-600 mb-4">Get in touch with our team for general inquiries.</p>
            <a href="/contact" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              Contact Support <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Response Time Section - Full Width */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
            </div>
            <p className="text-gray-600">
              We typically respond to support tickets within 24 hours during business days.
            </p>
          </div>
        </div>

        {/* Support Form Section - Full Width */}
        <div className="max-w-6xl mx-auto">
          <SupportForm />
        </div>
      </div>
    </div>
  );
}
