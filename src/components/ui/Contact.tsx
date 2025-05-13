'use client';

import { EnvelopeIcon, PhoneIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// Airtable form configuration
const AIRTABLE_FORM_URL = 'https://airtable.com/embed/app9KvSkBwix9MnSr/pagGflxAdmJG76KS8/form';

export default function Contact() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-semibold mb-8">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-base font-medium mb-0.5">Email</div>
                    <a href="mailto:hello@cofabri.com" className="text-blue-600">
                      hello@cofabri.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-base font-medium mb-0.5">Phone</div>
                    <a href="tel:+1234567890" className="text-blue-600">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
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

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold">AI Assistant</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Need quick help? Our AI assistant is available 24/7 to answer your questions.
              </p>
              <button className="w-full bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-colors">
                Start Chat
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-center min-h-full">
            <iframe
              className="airtable-embed"
              src={AIRTABLE_FORM_URL}
              frameBorder="0"
              width="100%"
              height="725"
              style={{ background: 'transparent' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
} 