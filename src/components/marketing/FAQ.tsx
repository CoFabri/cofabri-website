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
    question: 'Who are CoFabri\'s apps built for?',
    answer: 'Operators who want a tool that does one job well — solo founders and growing teams across a wide range of industries. If you\'re tired of paying for a platform that does twelve things adequately, our apps are built for you.',
  },
  {
    question: 'What kind of apps does CoFabri offer?',
    answer: 'A growing portfolio of apps, each solving one specific business problem — workflow automation, client communication, whatever the industry needs. None of them try to be everything.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Most CoFabri apps run on a monthly subscription. Some offer a free trial or a one-time option. Pricing is on each app\'s own page — no hidden fees.',
  },
  {
    question: 'Is any setup required?',
    answer: 'Not much. Our apps are self-serve and most people are running in minutes. If you get stuck, real support is available — not just a help center.',
  },
  {
    question: 'How is CoFabri different from other platforms?',
    answer: 'We don\'t try to be a platform for everything. Every CoFabri app is built around one problem, which keeps it lean and out of your way.',
  },
  {
    question: 'Who\'s behind CoFabri?',
    answer: 'A small team that builds most of what we ship in-house. On some apps, we partner directly with people who know an industry better than we do — they bring the expertise, we bring the engineering.',
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
