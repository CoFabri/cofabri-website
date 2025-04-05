import React from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ShieldCheckIcon,
  CloudIcon,
  BellIcon,
  DocumentTextIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import SectionHeading from './SectionHeading';

const features = [
  {
    name: 'Analytics Dashboard',
    description: 'Get detailed insights and analytics to make data-driven decisions',
    icon: ChartBarIcon
  },
  {
    name: 'Team Collaboration',
    description: 'Enable seamless collaboration between team members',
    icon: UserGroupIcon
  },
  {
    name: 'Custom Integration',
    description: 'Integrate with your existing tools and workflows',
    icon: CogIcon
  },
  {
    name: 'Security & Compliance',
    description: 'Enterprise-grade security and compliance features',
    icon: ShieldCheckIcon
  },
  {
    name: 'Cloud Storage',
    description: 'Secure cloud storage for all your files and documents',
    icon: CloudIcon
  },
  {
    name: 'Real-time Notifications',
    description: 'Stay updated with real-time notifications and alerts',
    icon: BellIcon
  },
  {
    name: 'Document Management',
    description: 'Organize and manage your documents efficiently',
    icon: DocumentTextIcon
  },
  {
    name: 'Performance Metrics',
    description: 'Track and analyze performance metrics',
    icon: ChartPieIcon
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Powerful Features"
          subtitle="Everything you need to build and manage your projects efficiently."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="p-6 rounded-xl glass-card hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.name}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 