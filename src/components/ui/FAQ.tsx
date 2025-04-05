'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import SectionHeading from './SectionHeading';

const faqs = [
  {
    question: 'How do I get started with CoFabri apps?',
    answer: 'Getting started is easy! Simply sign up for an account, choose the app you want to use, and follow our quick start guide. We offer a free trial period for all our apps so you can explore their features.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'We provide comprehensive support including 24/7 email support, live chat during business hours, detailed documentation, video tutorials, and a community forum where you can connect with other users.',
  },
  {
    question: 'Can I integrate CoFabri apps with my existing tools?',
    answer: 'Yes! Our apps come with robust API support and pre-built integrations for popular tools like Slack, Microsoft Teams, Google Workspace, and more. We also offer custom integration support for enterprise customers.',
  },
  {
    question: 'How secure are CoFabri apps?',
    answer: 'Security is our top priority. We use industry-standard encryption, regular security audits, and comply with SOC 2 and GDPR requirements. Your data is stored in secure, redundant data centers with 99.9% uptime.',
  },
  {
    question: 'What are your pricing plans?',
    answer: 'We offer flexible pricing plans tailored to businesses of all sizes. Our plans start with a basic tier for small teams and scale up to enterprise solutions. All plans come with core features, and you can upgrade or downgrade at any time.',
  },
  {
    question: 'Do you offer custom solutions?',
    answer: 'Yes, we offer custom solutions for enterprise customers. Our team can work with you to customize our apps to meet your specific needs, including custom features, integrations, and deployment options.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about our products and services"
        />

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4"
            >
              <button
                className="w-full flex items-center justify-between p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-medium text-gray-900 text-left">
                  {faq.question}
                </span>
                <ChevronDownIcon
                  className={`w-6 h-6 text-gray-600 transform transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4">
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ; 