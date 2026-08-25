import { SVGProps } from "react";

export function HeatMapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 9h7v7h-7zM3 12h7v9H3zM14 18h7v3h-7z" />
      <path fill="none" d="M0 0h24v24H0z" />
    </svg>
  );
}
