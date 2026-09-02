'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, User } from 'lucide-react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CoreLoader } from '@/components/ui/core-loader';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        body: JSON.stringify({ firstName, lastName, email }),
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
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
          <h3 className="text-xl font-semibold text-foreground mb-2">You&apos;re Subscribed!</h3>
          <p className="text-muted-foreground mb-1">
            {firstName ? `Thank you for subscribing, ${firstName}!` : 'Thank you for subscribing to our newsletter.'}
          </p>
          <p className="text-muted-foreground">Updates will be sent to <span className="font-semibold text-foreground">{email}</span>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="newsletter-first-name" className="sr-only">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newsletter-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newsletter-last-name" className="sr-only">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newsletter-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newsletter-email" className="sr-only">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <CoreLoader size={16} tone="inverted" />
              Subscribing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      {isSuccess && (
        <p className="text-sm text-primary text-center">Successfully subscribed! Welcome to our newsletter.</p>
      )}
    </div>
  );
}
