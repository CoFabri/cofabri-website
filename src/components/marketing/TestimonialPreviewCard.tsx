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
    image: string;
  };
}

export default function TestimonialPreviewCard({ testimonial }: TestimonialPreviewCardProps) {
  return (
    <div className="group relative p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-1">
      <div className="flex items-center mb-6">
        <div className="relative w-14 h-14 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-110">
          <Image
            src={testimonial.image || '/images/placeholder.jpg'}
            alt={testimonial.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
            {testimonial.name}
          </h3>
          <p className="text-muted-foreground transition-colors duration-300">
            {testimonial.role}
          </p>
          <p className="text-muted-foreground text-sm transition-colors duration-300">
            {testimonial.company}
          </p>
        </div>
      </div>

      <div className="flex mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <StarIcon
            key={i}
            className="h-5 w-5 text-yellow-400 transition-transform duration-200 hover:scale-110"
          />
        ))}
      </div>

      <blockquote className="text-muted-foreground italic transition-colors duration-300">
        "{testimonial.content}"
      </blockquote>

      <div className="absolute top-4 right-4 text-6xl font-serif text-muted-foreground/10 select-none transition-transform duration-300 group-hover:scale-110 group-hover:text-muted-foreground/20">
        "
      </div>
    </div>
  );
}
