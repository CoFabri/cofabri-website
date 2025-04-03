'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './Logo';

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-50 animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-50 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-50 animate-float-slow" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-50 rounded-full filter blur-2xl opacity-40 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-50 rounded-full filter blur-2xl opacity-40 animate-float-slow" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex justify-center mb-0">
          <Logo size="hero" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animated-gradient-text">
          Powerful SaaS apps for your business needs
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Self-service solutions to help you grow and succeed
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apps"
            className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Explore Apps
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3 text-lg font-medium text-indigo-600 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl border border-indigo-100"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <div className="w-10 h-10 border-2 border-indigo-200 rounded-full animate-float" />
      </div>
    </section>
  );
};

export default Hero; 