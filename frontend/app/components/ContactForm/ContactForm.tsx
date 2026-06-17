"use client";
import React from "react";
import {
  FacebookIcon,
  GithubIcon,
  GoogleIcon,
  LinkedinIcon,
  PinterestIcon,
  XIcon,
  YoutubeIcon,
} from "@/app/components/Icons";
import { useContactForm } from "@/app/hooks/useContactForm";

function IconPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.51a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.57-1.06a2 2 0 0 1 2.11-.45c.81.24 1.65.42 2.51.54A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-2xl border border-foreground/10 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export const ContactForm = () => {
  const socialIcons = [
    { label: "Facebook", Icon: FacebookIcon },
    { label: "X", Icon: XIcon },
    { label: "Pinterest", Icon: PinterestIcon },
    { label: "LinkedIn", Icon: LinkedinIcon },
    { label: "YouTube", Icon: YoutubeIcon },
    { label: "Google", Icon: GoogleIcon },
    { label: "GitHub", Icon: GithubIcon },
  ] as const;

  const {
    fields,
    fieldErrors: errors,
    loading,
    sent,
    onChange,
    submit,
    reset: handleReset,
  } = useContactForm();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div
      id="contact"
      className="container max-w-7xl mx-auto p-1 lg:p-0"
      aria-labelledby="contact-title"
      data-testid="contact_form_section"
    >
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-medium uppercase tracking-wide text-muted">
            Contact
          </h3>
          <h2
            id="contact-title"
            className="mt-3 text-3xl font-semibold text-foreground sm:text-5xl"
          >
            Envoyez-nous un message
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Remplissez le formulaire et nous vous répondrons dans les plus brefs
            délais.
          </p>

          {sent ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                <IconCheck className="h-7 w-7 text-background" />
              </div>
              <p className="text-lg font-semibold text-success">
                Message envoyé !
              </p>
              <p className="text-sm text-muted">
                Merci
                <span className="font-medium text-foreground">
                  {fields.name}
                </span>
                . Nous vous répondrons à{" "}
                <span className="font-medium text-foreground">
                  {fields.email}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary hover:cursor-pointer"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label
                  className="block text-sm font-medium text-foreground/90 mb-1.5"
                  htmlFor="name"
                >
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={[
                    inputClass,
                    errors.name ? "border-danger focus:ring-danger/20" : "",
                  ].join(" ")}
                  placeholder="Votre nom"
                  value={fields.name}
                  onChange={onChange("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-sm font-medium text-foreground/90 mb-1.5"
                    htmlFor="email"
                  >
                    Adresse e-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={[
                      inputClass,
                      errors.email ? "border-danger focus:ring-danger/20" : "",
                    ].join(" ")}
                    placeholder="vous@exemple.com"
                    value={fields.email}
                    onChange={onChange("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground/90 mb-1.5"
                    htmlFor="phone"
                  >
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                    placeholder="+33 6 00 00 00 00"
                    value={fields.phone}
                    onChange={onChange("phone")}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-foreground/90 mb-1.5"
                  htmlFor="message"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className={[
                    inputClass,
                    "resize-none min-h-35 leading-relaxed",
                    errors.message ? "border-danger focus:ring-danger/20" : "",
                  ].join(" ")}
                  placeholder="Dites-nous ce dont vous avez besoin..."
                  value={fields.message}
                  onChange={onChange("message")}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="hover:cursor-pointer w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>

        {/* Right: Info */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-medium uppercase tracking-wide text-muted">
            Me contacter
          </h3>
          <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-5xl">
            Une question ou une collaboration ?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Que ce soit pour un retour sur le projet, une opportunité freelance
            ou simplement pour échanger — je lis tous les messages.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <IconMail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a
                  className="text-sm text-muted hover:text-primary transition"
                  href="mailto:abdel.pp@gmail.com"
                >
                  abdel.pp@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <IconPhone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Délai de réponse
                </p>
                <p className="text-sm text-muted">Généralement sous 48h</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <IconPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Disponibilité
                </p>
                <p className="text-sm text-muted">
                  Ouvert aux missions freelance &amp; collaborations — remote
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-sm font-medium text-foreground mb-4">
              Retrouvez-moi sur
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {socialIcons.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 bg-background/40 hover:bg-primary hover:border-primary transition"
                >
                  <Icon className="h-5 w-5 text-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
