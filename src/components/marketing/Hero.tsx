'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConnectedNodesDiagram from './ConnectedNodesDiagram';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Powerful SaaS apps for your business needs
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            Self-service solutions to help you grow and succeed
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
            <Button asChild size="lg">
              <Link href="/apps">
                Explore Apps
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                Contact Us
                <Mail className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="w-full max-w-md md:max-w-lg">
          <ConnectedNodesDiagram className="h-auto w-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
