'use client';

import React from 'react';
import Link from 'next/link';
import GradientHeading from '@/components/ui/GradientHeading';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SparklesIcon, RocketLaunchIcon, StarIcon, HeartIcon, CheckCircleIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import SparkleButton from '@/components/ui/SparkleButton';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  appId?: string;
  interestLevel?: number;
  quote?: number;
  statement?: string;
}

interface AppData {
  betaSpotsTotal: number;
  betaSpotsFilled: number;
  betaPrice: number;
  betaDescription: string;
  status: string;
  name: string;
}

interface Testimonial {
  ID: string;
  Company: string;
  Statement: string;
}

function SignupPageContent() {
  const searchParams = useSearchParams();
  const [interestLevel, setInterestLevel] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    appId: '',
    quote: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAppId, setHasAppId] = useState(false);
  const [displayedTestimonials, setDisplayedTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (!searchParams) return;
    
    const appId = searchParams.get('appId');
    if (appId) {
      setHasAppId(true);
      setFormData(prev => ({ ...prev, appId }));
      fetchAppData(appId);
    } else {
      setHasAppId(false);
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (testimonials.length > 0) {
      // Function to get random testimonials
      const getRandomTestimonials = () => {
        const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
      };

      // Set initial testimonials
      setDisplayedTestimonials(getRandomTestimonials());

      // Update testimonials every 10 seconds
      const interval = setInterval(() => {
        setDisplayedTestimonials(getRandomTestimonials());
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [testimonials]);

  const fetchAppData = async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}`);
      if (!response.ok) throw new Error('Failed to fetch app data');
      const data = await response.json();
      setAppData(data);
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error fetching app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestLevel = (level: number) => {
    setInterestLevel(level);
    setFormData(prev => ({ ...prev, interestLevel: level }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quote' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure interestLevel is included in the form data
      const submitData = {
        ...formData,
        interestLevel: interestLevel || 0
      };

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setShowThankYou(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      // You might want to show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasAppId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <p className="text-gray-600">
            Please access this page with a valid app ID. Example: /signup?appId=your-app-id
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <AnimatedGradient />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-50 animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-50 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-600">
                <SparklesIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animated-gradient-text">
              Be the First to Experience {appData?.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our exclusive waitlist and get early access to our upcoming products.
              We're building something special, and you'll be among the first to experience it.
            </p>

            {/* Beta Spots Progress */}
            {!isLoading && appData && (
              <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-lg mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-600">Beta Spots Remaining</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">
                    {appData.betaSpotsTotal - appData.betaSpotsFilled}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(appData.betaSpotsFilled / appData.betaSpotsTotal) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {appData.betaSpotsTotal - appData.betaSpotsFilled < 10 ? (
                    <span className="text-red-500 font-medium">
                      Hurry! Only {appData.betaSpotsTotal - appData.betaSpotsFilled} spots left!
                    </span>
                  ) : (
                    `${appData.betaSpotsFilled} people have already joined`
                  )}
                </p>
                {appData.betaPrice > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Beta access: ${appData.betaPrice}/month
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Visuals */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 text-white">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Why Join?</h2>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Early access to new features
                      </li>
                      <li className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Exclusive beta testing opportunities
                      </li>
                      <li className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Direct influence on product development
                      </li>
                      <li className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Special launch offers
                      </li>
                    </ul>
                  </div>

                  {/* Testimonials */}
                  {displayedTestimonials.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-2xl font-bold text-white mb-6">What People Are Saying</h3>
                      <div className="space-y-6">
                        {displayedTestimonials.map((testimonial, index) => (
                          <div 
                            key={index} 
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 transform transition-all duration-500 hover:scale-105 hover:bg-white/15 relative"
                          >
                            <div className="absolute top-4 right-4 text-6xl font-serif text-white/20 select-none">"</div>
                            <div className="flex-1">
                              <p className="text-white/90 leading-relaxed italic text-lg">"{testimonial.Statement}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-8 lg:p-12">
                <div className="space-y-6">
                  {showThankYou ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HeartIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
                      <p className="text-gray-600">
                        We've received your submission and will keep you updated on our progress.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 lg:p-12 border border-white/20">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the {appData?.name} Waitlist</h2>
                        <p className="text-gray-600">Fill out the form below to secure your spot on our waitlist. We'll notify you as soon as we're ready to launch.</p>
                      </div>



                      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              required
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              required
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="you@company.com"
                          />
                        </div>

                        {/* Interest Level Selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            How interested are you? <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleInterestLevel(level)}
                                className="p-2 hover:scale-110 transition-transform"
                              >
                                <StarIcon
                                  className={`w-8 h-8 ${
                                    level <= (interestLevel || 0)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          {!interestLevel && (
                            <p className="mt-1 text-sm text-red-500">Please select your interest level</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-1">
                            How much would you pay monthly? <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              id="quote"
                              name="quote"
                              required
                              min="0"
                              step="1"
                              value={formData.quote}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter amount"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="statement" className="block text-sm font-medium text-gray-700 mb-1">
                            Beta Statement (Optional)
                          </label>
                          <textarea
                            id="statement"
                            name="statement"
                            value={formData.statement}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                            placeholder="Share why you're excited about this beta"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            If approved, your statement will appear on this waitlist page
                          </p>
                        </div>
                        <SparkleButton
                          type="submit"
                          disabled={isSubmitting || !interestLevel}
                          className="w-full bg-indigo-600 text-white rounded-lg py-3 px-6 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                        </SparkleButton>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
} 