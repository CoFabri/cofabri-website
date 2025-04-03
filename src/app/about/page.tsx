import React from 'react';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const teamMembers = [
  {
    name: 'Alex Thompson',
    role: 'CEO & Founder',
    bio: 'With over 15 years of experience in software development and business management, Alex leads CoFabri with a vision for innovation and customer success.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Maria Garcia',
    role: 'CTO',
    bio: 'Maria brings her expertise in cloud architecture and scalable systems to drive our technical innovation forward.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d34d939b2f?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'David Kim',
    role: 'Head of Product',
    bio: 'David ensures our products meet the highest standards of quality and user experience.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
];

const coreValues = [
  {
    title: 'Innovation',
    description: 'We constantly push boundaries to deliver cutting-edge solutions.',
  },
  {
    title: 'Customer Success',
    description: 'Our success is measured by our customers\' achievements.',
  },
  {
    title: 'Integrity',
    description: 'We maintain the highest standards of honesty and transparency.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative gradient-bg">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              About CoFabri
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Pioneering the future of manufacturing through innovation, expertise, and sustainable solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Mission and Vision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600">
              To revolutionize the manufacturing industry by providing innovative automation solutions that enhance efficiency, reduce costs, and promote sustainable practices.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-lg text-gray-600">
              To be the global leader in manufacturing innovation, setting new standards for industrial automation and sustainable production.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">Continuously pushing boundaries to develop cutting-edge solutions.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <UserGroupIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaboration</h3>
              <p className="text-gray-600">Working together with clients to achieve shared success.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ChartBarIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">Committed to delivering the highest quality in everything we do.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <LightBulbIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainability</h3>
              <p className="text-gray-600">Developing solutions that benefit both business and the environment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={member.name} className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
              <p className="text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 