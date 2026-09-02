'use client';

import React, { useEffect, useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import SectionHeading from './SectionHeading';
import TestimonialPreviewCard from './TestimonialPreviewCard';
import { Testimonial, getTestimonials } from '@/lib/airtable';

interface TestimonialsProps {
  appId?: string;
}

const Testimonials = ({ appId }: TestimonialsProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        let url = '/api/testimonials';
        if (appId) {
          url += `?appId=${encodeURIComponent(appId)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch testimonials');
        const data = await response.json();
        setTestimonials(data);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch testimonials');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestimonials();
  }, [appId]);

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="relative p-8 rounded-2xl bg-white shadow-lg animate-pulse"
              >
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="ml-4">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded mb-4" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="text-center text-red-500">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Hear from businesses that have transformed their operations with our apps"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialPreviewCard
              key={testimonial.id}
              testimonial={{
                id: testimonial.id,
                name: testimonial.name,
                role: testimonial.role,
                company: testimonial.company,
                content: testimonial.content,
                rating: testimonial.rating,
                image: testimonial.image
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 