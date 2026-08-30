import React from "react";
import { SectionHeader } from "@/app/ui/SectionHeader/SectionHeader";

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-surface bg-card p-6 sm:p-8">
      <SectionHeader title={title} />
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalPageHeader({
  eyebrow,
  title,
  highlight,
  updatedAt,
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  updatedAt: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
        {title} <span className="text-primary">{highlight}</span>
      </h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updatedAt}</p>
    </div>
  );
}
