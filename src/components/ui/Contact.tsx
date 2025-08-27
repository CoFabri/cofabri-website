'use client';

import { EnvelopeIcon, PhoneIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import AirtableFormLoader from './AirtableFormLoader';

// Airtable form configuration
const AIRTABLE_FORM_BASE_URL = 'https://airtable.com/embed/app9KvSkBwix9MnSr/pagGflxAdmJG76KS8/form';

export default function Contact() {
  const searchParams = useSearchParams();
  
  // Construct the Airtable form URL with prefill parameters only
  const airtableFormUrl = useMemo(() => {
    let url = AIRTABLE_FORM_BASE_URL;
    const params = [];
    
    // Handle language parameter
    const language = searchParams?.get('language');
    if (language) {
      params.push(`prefill_Language+Preference=${encodeURIComponent(language)}`);
    }
    
    // Handle app parameter
    const app = searchParams?.get('app');
    if (app) {
      params.push(`prefill_Related+App%28s%29=${encodeURIComponent(app)}`);
    }

    
    // Handle first name parameter
    const firstName = searchParams?.get('firstName');
    if (firstName) {
      params.push(`prefill_First+Name=${encodeURIComponent(firstName)}`);
    }
    
    // Handle last name parameter
    const lastName = searchParams?.get('lastName');
    if (lastName) {
      params.push(`prefill_Last+Name=${encodeURIComponent(lastName)}`);
    }
    
    // Handle email parameter
    const email = searchParams?.get('email');
    if (email) {
      params.push(`prefill_Email=${encodeURIComponent(email)}`);
    }
    
    // Add parameters to URL if any exist
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    // Debug logging
    console.log('Original URL params:', { language, app, firstName, lastName, email });
    console.log('Constructed Airtable URL:', url);
    
    return url;
  }, [searchParams]);

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
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <AirtableFormLoader
              src={airtableFormUrl}
              height="1150px"
              title="Contact Form"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 