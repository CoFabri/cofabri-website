'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const RevealSection = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<'section'>>(
  function RevealSection({ children, ...props }, ref) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
      return (
        <section ref={ref} {...props}>
          {children}
        </section>
      );
    }

    return (
      <motion.section
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 'some' }}
        variants={variants}
        {...(props as React.ComponentProps<typeof motion.section>)}
      >
        {children}
      </motion.section>
    );
  }
);

export default RevealSection;
