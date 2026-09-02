'use client';

import React, { useEffect, useState } from 'react';
import SectionHeading from './SectionHeading';
import TestimonialPreviewCard from './TestimonialPreviewCard';
import RevealSection from './RevealSection';
import { Testimonial } from '@/lib/airtable';

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
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="relative p-8 rounded-2xl bg-card border border-border shadow-sm animate-pulse"
              >
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-muted" />
                  <div className="ml-4">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded mt-2" />
                  </div>
                </div>
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Hear from businesses that have transformed their operations with our apps"
          />
          <div className="text-center text-destructive">
            {error}
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevealSection className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Testimonials"
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
    </RevealSection>
  );
};

export default Testimonials;
