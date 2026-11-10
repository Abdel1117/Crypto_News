"use client";

import { useEffect, useRef } from "react";
import { CoverImage } from "@/app/components/Blog/CoverImage";
import { ALT_MAX, IMAGE_TYPES } from "@/app/lib/api/blog";
import { categoryStyle } from "@/app/ui/CategoryBadge/CategoryBadge";
import { Counter, FieldError } from "./fields";

/**
 * The article's cover image: pick, replace or remove it, and write its text
 * alternative. Sending the file is the editor's job (`onPick`).
 */
export default function CoverField({
  image,
  alt,
  category,
  uploading,
  disabled,
  uploadError,
  altError,
  onPick,
  onRemove,
  onAltChange,
}: Readonly<{
  image: string | null;
  alt: string;
  /** Tints the empty frame like the article's cards. */
  category: string;
  uploading: boolean;
  disabled: boolean;
  uploadError: string;
  altError?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
  onAltChange: (alt: string) => void;
}>) {
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);
  const shown = useRef(image);

  // A new image is in: straight to its description.
  useEffect(() => {
    if (image && image !== shown.current) altInput.current?.focus();
    shown.current = image;
  }, [image]);

  const busy = uploading || disabled;

  return (
    <div className="flex flex-col gap-4">
      <div className="n-field">
        <span className="n-label" id="article-cover-label">
          Image de couverture{" "}
          <span className="text-(--n-neutral-500)">(facultative)</span>
        </span>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className="n-cover relative aspect-video w-full flex-none overflow-hidden rounded-lg sm:w-[280px]"
            style={categoryStyle(category)}
          >
            {image ? (
              <CoverImage image={image} alt={alt} sizes="280px" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-xs text-white/70">
                Aucune image
              </span>
            )}
            {uploading && (
              <span
                role="status"
                className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-white"
              >
                Envoi de l’image…
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="hidden"
              aria-label="Fichier de l’image de couverture"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Cleared: choosing the same file again still triggers a change.
                e.target.value = "";
                if (file) onPick(file);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="n-btn n-btn-secondary"
                disabled={busy}
                aria-describedby="article-cover-help"
                onClick={() => fileInput.current?.click()}
              >
                {image ? "Remplacer l’image" : "Choisir une image"}
              </button>
              {image && (
                <button
                  type="button"
                  className="n-btn text-(--n-neutral-400)!"
                  disabled={busy}
                  onClick={onRemove}
                >
                  Retirer
                </button>
              )}
            </div>
            <p id="article-cover-help" className="m-0 text-xs text-(--n-neutral-500)">
              JPEG, PNG ou WebP, 5 Mo maximum. Format paysage conseillé, au
              moins 1600 px de large.
            </p>
            {uploadError && (
              <p role="alert" className="n-field-error m-0!">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      {image && (
        <div className="n-field">
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="article-cover-alt">Texte alternatif</label>
            <Counter value={alt} max={ALT_MAX} />
          </div>
          <input
            ref={altInput}
            id="article-cover-alt"
            className="n-text-input"
            value={alt}
            maxLength={ALT_MAX}
            onChange={(e) => onAltChange(e.target.value)}
            aria-invalid={altError ? true : undefined}
            aria-describedby={
              altError
                ? "article-cover-alt-help article-cover-alt-error"
                : "article-cover-alt-help"
            }
            placeholder="Ex. : courbe du cours du bitcoin en forte hausse sur un an"
          />
          <p id="article-cover-alt-help" className="mt-1.5 mb-0 text-xs text-(--n-neutral-500)">
            Décrit l’image pour qui ne la voit pas : lecteurs d’écran, image
            qui ne charge pas, moteurs de recherche.
          </p>
          <FieldError id="article-cover-alt-error" message={altError} />
        </div>
      )}
    </div>
  );
}
