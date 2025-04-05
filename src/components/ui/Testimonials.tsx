'use client';

import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import SectionHeading from './SectionHeading';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechStart',
    image: '/testimonials/sarah.jpg',
    rating: 5,
    content: 'The apps have transformed how we work. The collaboration features are game-changing.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO, InnovateCorp',
    image: '/testimonials/michael.jpg',
    rating: 5,
    content: 'Best-in-class security and compliance features. Exactly what we needed.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Product Manager, GrowthLabs',
    image: '/testimonials/emily.jpg',
    rating: 5,
    content: 'The analytics and insights have helped us make better decisions.'
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Hear from businesses that have transformed their operations with our apps"
        />

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