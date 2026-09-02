'use client';

import React from 'react';
import SectionHeading from './SectionHeading';
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
    <RevealSection className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about our products and services"
        />

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-lg font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
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
