import type { Transition, Variants } from "framer-motion";

/**
 * Centralized motion values for the Magizh design language.
 *
 * Durations stay short (150–300ms) so navigation and loading feel
 * responsive rather than decorative. Consume these variants with
 * Framer Motion and respect `prefers-reduced-motion` at the point of
 * use (see `template.tsx` and the page-level wrappers).
 */

export const MOTION_DURATION = 0.2;

export const pageTransition: Transition = {
  duration: MOTION_DURATION,
  ease: [0.25, 0.1, 0.25, 1],
};

export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: pageTransition,
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
};