'use client';

import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Cookies from 'js-cookie';

interface NewsletterSignupProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function NewsletterSignup({ 
  className = '',
  title = 'Subscribe to our newsletter',
  description = 'Get weekly updates on the latest articles and insights.'
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasSubscribed, setHasSubscribed] = useState(false);

  useEffect(() => {
    // Check if user has already subscribed
    const subscribedEmail = Cookies.get('newsletter_subscribed');
    if (subscribedEmail) {
      setHasSubscribed(true);
      setEmail(subscribedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Set cookie to prevent multiple signups
      Cookies.set('newsletter_subscribed', email, { expires: 365 }); // Expires in 1 year
      setIsSuccess(true);
      setHasSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubscribed) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[220px] ${className}`}>
        <div className="flex flex-col items-center bg-white/20 border border-green-400 rounded-2xl p-8 max-w-md mx-auto shadow-lg">
          <CheckCircleIcon className="h-12 w-12 text-green-400 mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">You're Subscribed!</h3>
          <p className="text-blue-100 mb-1 text-center">Thank you for subscribing to our newsletter.</p>
          <p className="text-blue-100 text-center">Updates will be sent to <span className="font-semibold text-white">{email}</span>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-blue-100">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-200">{error}</p>
      )}
      {isSuccess && (
        <p className="text-sm text-green-200">Successfully subscribed! Welcome to our newsletter.</p>
      )}
    </div>
  );
} 