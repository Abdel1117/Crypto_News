import Image, { StaticImageData } from "next/image";
import Link from "next/link";

interface BlockCTAProps {
  imageSrc: string | StaticImageData;
  captionTitle: string;
  title: string;
  underTitle: string;
  firstParam: string;
  secondParam: string;
  boutonText: string;
  boutonHref: string;
  notReversed: boolean;
  hidebutton: boolean;
}

export default function BlockCTA({
  imageSrc,
  captionTitle,
  title,
  underTitle,
  firstParam,
  secondParam,
  boutonText,
  boutonHref,
  notReversed = true,
  hidebutton = false,
}: BlockCTAProps) {
  const containerClassName = `container max-w-7xl mx-auto flex flex-col ${notReversed ? "lg:flex-row" : "lg:flex-row-reverse"} px-1 sm:px-0 relative z-50`;
  return (
    <div aria-labelledby="block-cta-title">
      <div className={containerClassName}>
        <div className="w-full lg:w-1/2 mb-5 lg:mb-0">
          <div className="w-full min-h-full lg:w-auto mx-auto flex items-center justify-center lg:justify-start lg:items-start">
            <Image
              src={imageSrc}
              sizes="(max-width: 1024px) 100vw, 482px"
              priority
              className="h-auto w-[482px] max-w-full rounded object-cover object-center"
              alt="Illustration d'un visuel crypto (Ethereum, Bitcoin)"
            />
          </div>
        </div>

        {/* Text section */}
        <div className="w-full lg:w-1/2 self-center text-center md:items-start lg:text-left">
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            {captionTitle}
          </p>

          <h2
            id="block-cta-title"
            className="mt-3 text-3xl font-semibold text-foreground sm:text-6xl"
          >
            {title}
            <br className="hidden lg:inline-block" />
            {underTitle}
          </h2>

          <p className="mt-6 text-base leading-relaxed text-foreground">
            {firstParam}
          </p>
          <p className="mt-6 text-base leading-relaxed text-foreground">
            {secondParam}
          </p>
          {!hidebutton && (
            <div className="mt-10 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href={boutonHref}
                className="inline-flex items-center justify-center rounded bg-primary px-6 py-4 text-lg text-white  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:opacity-75 "
              >
                {boutonText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
