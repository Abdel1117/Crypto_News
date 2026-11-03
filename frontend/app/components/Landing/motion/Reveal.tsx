"use client";

import type { HTMLAttributes } from "react";
import { useLandingMotion } from "./useLandingMotion";
import {
  contactReveal,
  featuresReveal,
  partnersReveal,
  previewIntro,
} from "./landingMotion";

// Server components can't pass functions to client components, so they pick
// their animation by name.
const PRESETS = {
  partners: partnersReveal,
  features: featuresReveal,
  contact: contactReveal,
  preview: previewIntro,
};

type RevealProps = HTMLAttributes<HTMLElement> & {
  preset: keyof typeof PRESETS;
  as?: "section" | "div";
};

/**
 * A section whose content animates in with anime.js. Its children stay
 * server-rendered; it is hidden until the animation takes over.
 */
export default function Reveal({
  preset,
  as: Tag = "section",
  ...props
}: RevealProps) {
  const ref = useLandingMotion<HTMLDivElement>(PRESETS[preset]);
  return <Tag ref={ref} data-motion-root="" data-motion-hide="" {...props} />;
}
