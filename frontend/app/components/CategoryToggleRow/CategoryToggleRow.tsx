"use client";

import { CookieCategoryConfig } from "@/app/context/Consent/ConsentContext";

interface CategoryToggleRowProps {
  category: CookieCategoryConfig;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export default function CategoryToggleRow({
  category,
  checked,
  onChange,
}: CategoryToggleRowProps) {
  const locked = category.required;

  return (
    <div className="flex flex-col gap-1 px-3.5 py-3 bg-(--n-surface)">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{category.title}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={
            locked ? `${category.title} (toujours actif)` : category.title
          }
          disabled={locked}
          onClick={() => onChange?.(!checked)}
          className={[
            "relative flex-none w-10 h-6 rounded-full border-0 p-0 transition-colors",
            checked
              ? "bg-(--n-accent)"
              : "bg-[color-mix(in_srgb,var(--n-text)_18%,transparent)]",
            locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-4" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>
      <p className="m-0 text-xs leading-relaxed text-(--n-neutral-400)">
        {category.description}
      </p>
      {locked && (
        <p className="m-0 text-[11px] font-medium text-(--n-neutral-500)">
          Toujours actif
        </p>
      )}
    </div>
  );
}
