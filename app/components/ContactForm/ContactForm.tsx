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

  const inputClassName =
    "w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div
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
            Send us a message
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            Fill the form and we’ll get back to you as soon as possible.
          </p>

          <form className="mt-8 space-y-5" action="#" method="post">
            <div>
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="name"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={inputClassName}
                placeholder="Your name"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputClassName}
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor="phone"
                >
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClassName}
                  placeholder="+33 6 00 00 00 00"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="message"
              >
                Comment
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className={
                  inputClassName + " resize-none min-h-35 leading-relaxed"
                }
                placeholder="Tell us what you need..."
                required
              />
            </div>

            <button
              type="submit"
              className="hover:cursor-pointer px-5 py-3 bg-primary font-semibold rounded-lg transition-all duration-300 transform shadow-xl"
            >
              Send message
            </button>
          </form>
        </div>

        {/* Right: Info */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-medium uppercase tracking-wide text-muted">
            Get in touch
          </h3>
          <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-5xl">
            We’d love to hear from you
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            You can reach us through the details below. We usually respond
            within 24 hours.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <IconPin className="h-20 w-20 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Address</p>
                <p className="text-base text-foreground">
                  10 Rue de la Crypto, 75000 Paris
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <IconPhone className="h-20 w-20 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <a
                  className="text-base text-foreground hover:underline"
                  href="tel:+33600000000"
                >
                  +33 6 00 00 00 00
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <IconMail className="h-20 w-20 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a
                  className="text-base text-foreground hover:underline"
                  href="mailto:hello@crypto.com"
                >
                  hello@crypto.com
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {socialIcons.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="inline-flex h-12 w-12 p-2 items-center justify-center rounded-full border border-foreground/15 bg-background/40 hover:bg-primary transition"
                >
                  <Icon className="h-7 w-7 text-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
