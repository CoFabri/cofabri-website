'use client';

import React from 'react';
import { 
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  RocketLaunchIcon,
  ChevronRightIcon,
  StarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const RoadmapPage = () => {
  const roadmapItems = [
    {
      status: 'completed',
      date: 'Q1 2024',
      title: 'Platform Launch',
      description: 'Initial release of the CoFabri platform with core features and integrations.',
      features: [
        'User authentication and authorization',
        'Basic app marketplace',
        'Integration framework',
        'Documentation portal'
      ],
      icon: RocketLaunchIcon
    },
    {
      status: 'in-progress',
      date: 'Q2 2024',
      title: 'Enhanced Integration Capabilities',
      description: 'Expanding our integration options and improving the developer experience.',
      features: [
        'Advanced API management',
        'Custom workflow builder',
        'Enhanced security features',
        'Performance optimization'
      ],
      icon: BeakerIcon
    },
    {
      status: 'planned',
      date: 'Q3 2024',
      title: 'AI-Powered Features',
      description: 'Introducing intelligent automation and predictive analytics.',
      features: [
        'AI-driven recommendations',
        'Automated workflow suggestions',
        'Predictive analytics dashboard',
        'Natural language processing capabilities'
      ],
      icon: LightBulbIcon
    },
    {
      status: 'planned',
      date: 'Q4 2024',
      title: 'Enterprise Features',
      description: 'Advanced features for large-scale enterprise deployments.',
      features: [
        'Multi-tenant architecture',
        'Advanced role-based access control',
        'Audit logging and compliance',
        'Enterprise-grade support'
      ],
      icon: StarIcon
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <ClockIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animated-gradient-text">
            Product Roadmap
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-2xl mx-auto mb-12">
            Explore our vision for the future and see what we're building next.
            Our roadmap is shaped by customer feedback and industry trends.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {roadmapItems.map((item, index) => (
            <div key={index} className="relative">
              {/* Timeline line */}
              {index !== roadmapItems.length - 1 && (
                <div 
                  className="absolute left-8 top-20 bottom-0 w-0.5 bg-gray-200"
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}

              <div className="relative flex gap-8 mb-12">
                {/* Timeline marker */}
                <div className="flex-none pt-2">
                  {getStatusIcon(item.status)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Quarter badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 border ${getStatusClass(item.status)}`}>
                    {item.date}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                      <item.icon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Key Features:</h3>
                      <ul className="space-y-2">
                        {item.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <ChevronRightIcon className="w-4 h-4 text-blue-500 mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Help Shape Our Future</h2>
              <p className="text-blue-50 mb-8">
                We value your input! Share your ideas and feedback to help us prioritize our roadmap
                and build features that matter most to you.
              </p>
              <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition">
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage; 