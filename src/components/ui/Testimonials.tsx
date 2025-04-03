'use client';

import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO at TechFlow',
    content: 'The Project Manager Pro app has completely transformed how we handle our projects. The AI-powered insights have helped us improve efficiency by 40%.',
    image: '/testimonials/sarah.jpg',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Marketing Director at GrowthLabs',
    content: 'CRM Suite is a game-changer. The intelligent customer insights have helped us personalize our approach and increase customer retention significantly.',
    image: '/testimonials/michael.jpg',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Operations Manager at ScaleUp',
    content: 'The Analytics Dashboard provides crystal-clear insights that help us make data-driven decisions. It\'s become an essential tool for our business growth.',
    image: '/testimonials/emily.jpg',
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animated-gradient-text">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from businesses that have transformed their operations with our apps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-600">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="h-5 w-5 text-yellow-400"
                  />
                ))}
              </div>

              <blockquote className="text-gray-600 italic">
                "{testimonial.content}"
              </blockquote>

              <div className="absolute top-4 right-4 text-6xl font-serif text-indigo-100 select-none">
                "
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 