'use client';

import Contact from '@/components/ui/Contact';
import GradientHeading from '@/components/ui/GradientHeading';

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <GradientHeading
        title="Contact Us"
        subtitle="Get in touch with our team for any questions or support"
      />
      <Contact />
    </div>
  );
} 