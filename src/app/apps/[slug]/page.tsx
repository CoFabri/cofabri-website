'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    title: 'Advanced Analytics',
    description: 'Get deep insights into your business performance with our powerful analytics tools.',
    icon: ChartBarIcon,
  },
  {
    title: 'Team Collaboration',
    description: 'Work seamlessly with your team members in real-time.',
    icon: UserGroupIcon,
  },
  {
    title: 'Custom Configuration',
    description: 'Tailor the app to your specific needs with extensive customization options.',
    icon: CogIcon,
  },
];

const AppPage = ({ params }: { params: { slug: string } }) => {
  // This would normally come from an API or database
  const app = {
    name: 'Project Manager Pro',
    description: 'An AI-powered project management solution that helps teams collaborate effectively and deliver projects on time.',
    image: '/images/app-screenshot.png',
    features: [
      'AI-powered task assignment',
      'Real-time collaboration',
      'Custom workflow builder',
      'Advanced analytics dashboard',
      'Resource management',
      'Time tracking',
      'Budget monitoring',
      'Risk assessment',
    ],
    pricing: {
      monthly: 49,
      yearly: 490,
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-50 animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-50 animate-float-slow" />
        </div>

        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animated-gradient-text">
              {app.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {app.description}
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                Start Free Trial
              </button>
              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition shadow-lg hover:shadow-xl border border-blue-100">
                Watch Demo
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={app.image}
              alt={app.name}
              width={1200}
              height={675}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 animated-gradient-text">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 animated-gradient-text">
              Everything You Need
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {app.features.map((feature) => (
                <div key={feature} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 animated-gradient-text">
            Simple, Transparent Pricing
          </h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border-2 border-gray-100 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-2xl font-bold mb-4">Monthly Plan</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${app.pricing.monthly}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>All features included</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Unlimited users</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>
              <button className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                Start Monthly Plan
              </button>
            </div>

            <div className="p-8 rounded-2xl border-2 border-blue-100 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Annual Plan</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${app.pricing.yearly / 12}</span>
                <span className="text-gray-600">/month</span>
                <p className="text-sm text-gray-500 mt-1">Billed annually (${app.pricing.yearly})</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>All features included</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Unlimited users</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>2 months free</span>
                </li>
              </ul>
              <button className="w-full px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                Start Annual Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful businesses using {app.name} to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl">
              Start Free Trial
            </button>
            <button className="px-8 py-3 bg-transparent text-white rounded-lg hover:bg-blue-700 transition border-2 border-white">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppPage; 