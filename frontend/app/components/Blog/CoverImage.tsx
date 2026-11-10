import { coverUrl } from "@/app/lib/api/blog";

/**
 * An article's cover image, filling its positioned parent (cropped to fit).
 *
 * `alt` stays empty where the image only decorates a link that already says
 * the title (cards): a screen reader would otherwise read both, card after card.
 */
export function CoverImage({
  image,
  alt = "",
  sizes,
  priority = false,
  className = "",
}: Readonly<{
  image: string;
  alt?: string;
  /** Width the image takes on screen, so the browser picks the right file. */
  sizes: string;
  /** Visible on load (top of the page): fetched first, never lazily. */
  priority?: boolean;
  className?: string;
}>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- already resized and converted to WebP by the API
    <img
      src={coverUrl(image, "large")}
      srcSet={`${coverUrl(image, "small")} 640w, ${coverUrl(image, "large")} 1600w`}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
