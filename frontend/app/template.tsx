"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

/**
 * Page transition wrapper.
 *
 * A template renders between the layout and its children and remounts on
 * every navigation, so each page gets a subtle fade/translate in and out.
 * Durations are short (200ms) so navigation stays responsive. Respects
 * prefers-reduced-motion by rendering children with no animation.
 */
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {children}
    </motion.div>
  );
}