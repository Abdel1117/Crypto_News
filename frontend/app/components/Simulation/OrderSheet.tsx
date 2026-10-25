"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

interface OrderSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Mobile bottom sheet holding the order form. */
export default function OrderSheet({
  open,
  onClose,
  children,
}: OrderSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/55"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-sheet-title"
        className="relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto px-4 pt-2.5 pb-[max(28px,env(safe-area-inset-bottom))] rounded-t-[20px] bg-(--n-surface)"
        style={{ boxShadow: "var(--n-shadow-md)" }}
      >
        <span
          aria-hidden="true"
          className="self-center w-9 h-1 rounded-sm bg-(--n-neutral-700)"
        />
        <div className="flex items-center">
          <h2 id="order-sheet-title" className="m-0 mr-auto text-lg">
            Passer un ordre
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="n-btn n-btn-icon w-11! h-11! -mr-2.5"
            aria-label="Fermer"
            onClick={onClose}
          >
            <CloseIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
