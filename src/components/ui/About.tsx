'use client';

import React, { useEffect } from 'react';
import { ChartBarIcon, UserGroupIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import SectionHeading from './SectionHeading';
import { clearHydrationCaches } from '@/lib/utils';

const stats = [
  {
    name: 'Active Users',
    value: '10K+',
    icon: UserGroupIcon,
  },
  {
    name: 'Apps Launched',
    value: '5+',
    icon: SparklesIcon,
  },
  {
    name: 'Countries Served',
    value: '50+',
    icon: GlobeAltIcon,
  },
  {
    name: 'Success Rate',
    value: '98%',
    icon: ChartBarIcon,
  },
];

const About = () => {
  useEffect(() => {
    // Clear any cached content that might cause hydration issues
    clearHydrationCaches();
  }, []);

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <SectionHeading
          key="about-section-heading"
          title="About CoFabri"
          subtitle="Empowering Businesses Through Smart, Scalable Technology"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <p className="text-lg text-gray-600">
            CoFabri helps modern businesses unlock their potential through automation, AI-enhanced tools, and intuitive software. Whether you’re a solo founder or an established enterprise, our growing suite of apps is built to streamline operations, reduce inefficiencies, and spark meaningful growth.
            </p>
            <p className="text-lg text-gray-600">
            With deep expertise in software development and business process optimization, we create elegant, no-code and low-code solutions that simplify complexity and deliver measurable results. Every product is built to be modular, easy to adopt, and backed by ongoing support.
            </p>
            <p className="text-lg text-gray-600">
            We’re not just a software provider — we’re your technology partner.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Industry-leading automation and AI features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Frequent updates to improve every app</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Fast support</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl transform rotate-3"></div>
            <div className="relative bg-white p-8 rounded-2xl shadow-lg">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Our Mission</h3>
                <p className="text-gray-600">
                To empower businesses with intelligent technology solutions that drive performance, efficiency, and long-term success — without the traditional complexity.
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Why Choose CoFabri?</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-600">Proven track record of fast, effective deployments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-600">AI-powered automation built for real-world use cases</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-600">Modular SaaS apps that grow with your business</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-600">Transparent support and continuous improvements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.name} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About; 