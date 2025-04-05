'use client';

import React from 'react';
import {
  CodeBracketIcon,
  CpuChipIcon,
  CloudIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import GradientHeading from './GradientHeading';

const services = [
  {
    title: 'Project Manager Pro',
    description: 'AI-powered project management to streamline your workflow and boost productivity.',
    icon: CodeBracketIcon,
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    title: 'CRM Suite',
    description: 'Comprehensive customer relationship management with intelligent insights.',
    icon: CpuChipIcon,
    gradient: 'from-pink-500 to-purple-500',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Real-time data visualization and analytics to drive informed decisions.',
    icon: ChartBarIcon,
    gradient: 'from-red-500 to-pink-500',
  },
  {
    title: 'Cloud Solutions',
    description: 'Scalable and secure cloud infrastructure for your growing business.',
    icon: CloudIcon,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Analytics & Insights',
    description: 'Get detailed analytics and insights to make data-driven decisions',
    icon: ChartBarIcon,
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Team Collaboration',
    description: 'Enable seamless collaboration between team members',
    icon: UserGroupIcon,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Custom Integration',
    description: 'Integrate with your existing tools and workflows',
    icon: CogIcon,
    gradient: 'from-green-500 to-teal-500'
  },
  {
    title: 'Security & Compliance',
    description: 'Enterprise-grade security and compliance features',
    icon: ShieldCheckIcon,
    gradient: 'from-red-500 to-orange-500'
  }
];

const Services = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <GradientHeading
          title="Our Services"
          subtitle="Explore our comprehensive range of business solutions designed to transform your operations"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 mb-6 rounded-xl bg-gradient-to-br ${service.gradient} p-3 text-white`}>
                  <service.icon className="w-full h-full" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {service.title}
                </h3>
                
                <p className="text-gray-600">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 