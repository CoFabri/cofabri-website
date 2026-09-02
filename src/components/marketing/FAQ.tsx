'use client';

import React from 'react';
import Link from 'next/link';
import RevealSection from './RevealSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Who are CoFabri\'s tools built for?',
    answer: 'Our tools are built for anyone looking to save time and work smarter — from solo entrepreneurs to growing teams. While we serve a wide range of industries, most of our early users are business owners looking for affordable, no-code tools that solve real problems fast.',
  },
  {
    question: 'What kind of tools does CoFabri offer?',
    answer: 'CoFabri offers a growing suite of SaaS apps designed to solve specific business challenges — whether it\'s automating workflows, streamlining onboarding, or managing client communications. Each app is built to be simple, efficient, and ready to use.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Most CoFabri apps are available on a monthly subscription basis. Some offer a free trial or one-time purchase options depending on the use case. You\'ll find clear pricing details on each app\'s page — no hidden fees.',
  },
  {
    question: 'Is any setup required?',
    answer: 'Nope. Our apps are fully self-serve and designed for quick setup — many users are up and running in just minutes. If you ever need help, our team is available for general support and guidance.',
  },
  {
    question: 'How is CoFabri different from other platforms?',
    answer: 'We don\'t try to be everything. Each CoFabri app is built around solving one specific problem really well. That focus means our tools are lean, fast, and effective — not bloated with features you\'ll never use.',
  },
  {
    question: 'Who\'s behind CoFabri?',
    answer: 'We\'re a small but mighty team building all our tools in-house. That means we can move fast, adapt to your feedback, and keep improving with every release. No outside agencies. No guesswork.',
  },
];

const FAQ = () => {
  return (
    <RevealSection className="py-24 md:py-28 bg-background">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[320px_1fr] md:gap-20">
          <div>
            <h2 className="m-0 text-[32px] leading-[1.12] tracking-[-0.03em] font-semibold text-foreground sm:text-[36px]">
              Questions,
              <br />
              answered.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Still stuck?{' '}
              <Link href="/contact" className="font-medium text-primary hover:text-accent-hover">
                Talk to us
              </Link>
              .
            </p>
          </div>

          <Accordion type="single" collapsible className="border-t border-border">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="py-6 text-[18px] font-medium tracking-[-0.01em] text-foreground hover:no-underline hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pr-0 text-[16px] leading-[1.65] text-muted-foreground md:pr-20">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </RevealSection>
  );
};

export default FAQ;
