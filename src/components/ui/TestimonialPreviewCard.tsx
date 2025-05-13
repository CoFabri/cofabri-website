import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface TestimonialPreviewCardProps {
  testimonial: {
    id: string;
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
    image: {
      url: string;
      thumbnails?: {
        large: { url: string };
      };
    }[];
  };
}

export default function TestimonialPreviewCard({ testimonial }: TestimonialPreviewCardProps) {
  return (
    <div className="relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="relative w-14 h-14 rounded-full overflow-hidden">
          <Image
            src={testimonial.image[0]?.thumbnails?.large?.url || testimonial.image[0]?.url || '/images/placeholder.jpg'}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {testimonial.name}
          </h3>
          <p className="text-gray-600">
            {testimonial.role}
          </p>
          <p className="text-gray-500 text-sm">
            {testimonial.company}
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
  );
} 