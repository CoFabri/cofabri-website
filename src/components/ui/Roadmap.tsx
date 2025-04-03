'use client';

import React from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const milestones = [
  {
    title: 'Q2 2024',
    features: [
      {
        name: 'Advanced AI Task Assignment',
        description: 'Smarter task distribution based on team member skills and workload patterns.',
        status: 'in-progress',
      },
      {
        name: 'Real-time Collaboration Tools',
        description: 'Enhanced team collaboration features with live editing and commenting.',
        status: 'completed',
      },
      {
        name: 'Mobile App Release',
        description: 'Native mobile applications for iOS and Android platforms.',
        status: 'completed',
      },
    ],
  },
  {
    title: 'Q3 2024',
    features: [
      {
        name: 'Custom Dashboard Builder',
        description: 'Create personalized dashboards with drag-and-drop widgets.',
        status: 'planned',
      },
      {
        name: 'Advanced Analytics Integration',
        description: 'Deep integration with popular analytics platforms.',
        status: 'planned',
      },
      {
        name: 'Automated Reporting System',
        description: 'Schedule and generate custom reports automatically.',
        status: 'in-progress',
      },
    ],
  },
  {
    title: 'Q4 2024',
    features: [
      {
        name: 'AI-Powered Predictions',
        description: 'Predictive analytics for project timelines and resource allocation.',
        status: 'planned',
      },
      {
        name: 'Enhanced Security Features',
        description: 'Advanced security controls and compliance tools.',
        status: 'planned',
      },
      {
        name: 'Global Data Centers',
        description: 'Expanded infrastructure for better global coverage.',
        status: 'planned',
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-500 bg-green-50';
    case 'in-progress':
      return 'text-blue-500 bg-blue-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'in-progress':
      return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin-slow" />;
    default:
      return <ClockIcon className="w-5 h-5 text-gray-500" />;
  }
};

const Roadmap = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animated-gradient-text">
            Product Roadmap
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what's coming next and track our progress in making our apps even better
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {milestones.map((milestone) => (
            <div
              key={milestone.title}
              className="relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">
                {milestone.title}
              </h3>

              <div className="space-y-6">
                {milestone.features.map((feature) => (
                  <div
                    key={feature.name}
                    className="relative pl-8"
                  >
                    <div className="absolute left-0 top-1">
                      {getStatusIcon(feature.status)}
                    </div>
                    
                    <h4 className="text-lg font-medium mb-2 text-gray-900">
                      {feature.name}
                    </h4>
                    
                    <p className="text-gray-600 mb-2">
                      {feature.description}
                    </p>
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status === 'completed' ? 'Completed' : feature.status === 'in-progress' ? 'In Progress' : 'Planned'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap; 