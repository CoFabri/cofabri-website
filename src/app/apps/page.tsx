import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const apps = [
  {
    id: 'project-manager',
    title: 'Project Manager Pro',
    description: 'Streamline your project management with AI-powered insights and automation.',
    features: ['AI Task Assignment', 'Real-time Collaboration', 'Resource Optimization'],
    image: '/images/apps/project-manager.jpg',
  },
  {
    id: 'crm-suite',
    title: 'CRM Suite',
    description: 'Transform your customer relationships with intelligent CRM solutions.',
    features: ['Contact Management', 'Sales Pipeline', 'Customer Analytics'],
    image: '/images/apps/crm-suite.jpg',
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    description: 'Make data-driven decisions with our powerful analytics platform.',
    features: ['Custom Reports', 'Real-time Data', 'Predictive Analytics'],
    image: '/images/apps/analytics-dashboard.jpg',
  },
];

export const metadata = {
  title: 'Our Apps',
  description: 'Explore our suite of powerful SaaS applications designed to transform your business.',
};

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animated-gradient-text">
            Our Apps
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-2xl mx-auto mb-12">
            Discover our suite of powerful SaaS applications designed to transform your business operations.
          </p>
        </div>
      </section>

      {/* Apps Grid */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.id}`}
                className="group relative p-6 rounded-xl glass-card hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="aspect-video mb-6 rounded-lg overflow-hidden">
                    <img
                      src={app.image}
                      alt={app.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                    {app.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {app.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {app.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                    Learn More
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 