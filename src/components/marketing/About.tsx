'use client';

import React, { useEffect } from 'react';
import SectionHeading from './SectionHeading';
import RevealSection from './RevealSection';
import { Card } from '@/components/ui/card';
import { clearHydrationCaches } from '@/lib/utils';

const About = () => {
  useEffect(() => {
    // Clear any cached content that might cause hydration issues
    clearHydrationCaches();
  }, []);

  return (
    <RevealSection id="about" className="py-24 md:py-28 bg-background">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <SectionHeading
          key="about-section-heading"
          eyebrow="About Us"
          title="About CoFabri"
          subtitle="Empowering Businesses Through Smart, Scalable Technology"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
            CoFabri helps modern businesses unlock their potential through automation, AI-enhanced tools, and intuitive software. Whether you’re a solo founder or an established enterprise, our growing suite of apps is built to streamline operations, reduce inefficiencies, and spark meaningful growth.
            </p>
            <p className="text-lg text-muted-foreground">
            With deep expertise in software development and business process optimization, we create elegant, no-code and low-code solutions that simplify complexity and deliver measurable results. Every product is built to be modular, easy to adopt, and backed by ongoing support.
            </p>
            <p className="text-lg text-muted-foreground">
            We’re not just a software provider — we’re your technology partner.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Industry-leading automation and AI features</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Frequent updates to improve every app</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Fast support</span>
              </div>
            </div>
          </div>
          <Card className="p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Our Mission</h3>
              <p className="text-muted-foreground">
              To empower businesses with intelligent technology solutions that drive performance, efficiency, and long-term success — without the traditional complexity.
              </p>
              <div className="pt-4 border-t border-border">
                <h4 className="text-lg font-medium text-foreground mb-2">Why Choose CoFabri?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Proven track record of fast, effective deployments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">AI-powered automation built for real-world use cases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Modular SaaS apps that grow with your business</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-accent-foreground text-sm">✓</span>
                    </div>
                    <span className="text-muted-foreground">Transparent support and continuous improvements</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </RevealSection>
  );
};

export default About;
