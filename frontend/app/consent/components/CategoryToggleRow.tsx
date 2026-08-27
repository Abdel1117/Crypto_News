"use client";

import { CookieCategoryConfig } from "../useConsent";

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
    <div className="rounded-md border border-foreground/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{category.title}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={locked ? `${category.title} (toujours actif)` : category.title}
          disabled={locked}
          onClick={() => onChange?.(!checked)}
          className={[
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            checked ? "bg-primary" : "bg-foreground/15",
            locked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">{category.description}</p>
      {locked && (
        <p className="mt-1 text-[11px] font-medium text-muted">Toujours actif</p>
      )}
    </div>
  );
}
