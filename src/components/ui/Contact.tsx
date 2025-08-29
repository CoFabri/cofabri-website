'use client';

import { ClockIcon } from '@heroicons/react/24/outline';
import ContactForm from './ContactForm';

export default function Contact() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Contact Information - Full Width */}
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-8">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-base font-medium mb-0.5">Business Hours</div>
                  <div className="text-gray-600">
                    <div>Monday - Friday: 9:00 AM - 5:00 PM</div>
                    <div>Saturday: 10:00 AM - 2:00 PM</div>
                    <div>Sunday: Closed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - Full Width */}
          <ContactForm />
        </div>
      </div>
    </section>
  );
} 