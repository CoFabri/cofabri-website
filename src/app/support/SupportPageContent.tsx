'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  PhoneIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import GradientHeading from '@/components/marketing/GradientHeading';
import SupportForm from '@/components/marketing/SupportForm';

export default function SupportPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <GradientHeading
        title="Support Center"
        subtitle="We're here to help you succeed with our products and services"
      />

      <div className="container mx-auto px-4 mt-16">
        {/* Quick Actions Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold text-foreground">Knowledge Base</h3>
            </div>
            <p className="text-muted-foreground mb-4">Browse our comprehensive documentation and guides.</p>
            <Link href="/knowledge-base" className="text-primary hover:text-accent-hover inline-flex items-center">
              Visit Knowledge Base <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <ExclamationCircleIcon className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold text-foreground">System Status</h3>
            </div>
            <p className="text-muted-foreground mb-4">Check if there are any ongoing issues with our services.</p>
            <a href="/status" className="text-primary hover:text-accent-hover inline-flex items-center">
              Check Status <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </div>

          <div className="bg-card rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold text-foreground">Contact Us</h3>
            </div>
            <p className="text-muted-foreground mb-4">Get in touch with our team for general inquiries.</p>
            <a href="/contact" className="text-primary hover:text-accent-hover inline-flex items-center">
              Contact Support <ArrowRightIcon className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Response Time Section - Full Width */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold text-foreground">Response Time</h3>
            </div>
            <p className="text-muted-foreground">
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
