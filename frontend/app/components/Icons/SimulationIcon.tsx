import React, { SVGProps } from "react";

export function SimulationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        opacity="0.4"
        d="M2 2V19C2 20.66 3.34 22 5 22H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 17L9.59 11.64C10.35 10.76 11.7 10.7 12.52 11.53L13.47 12.48C14.29 13.3 15.64 13.25 16.4 12.37L21 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
