"use client";

import { useReducedMotion } from "framer-motion";

export { useReducedMotion };

export function pickVariants(motionVariants, stillVariants, reduced) {
  return reduced ? stillVariants : motionVariants;
}
