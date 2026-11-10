"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import {
  ALT_MAX,
  ALT_MIN,
  createArticle,
  EXCERPT_MAX,
  imageFileProblem,
  TITLE_MAX,
  updateArticle,
  uploadImage,
  type ArticleDetail,
  type ArticleInput,
  type ArticleStatus,
} from "@/app/lib/api/blog";
import ArticleBody from "@/app/components/Blog/ArticleBody";
import { CATEGORIES } from "@/app/components/Blog/categories";
import { CoverImage } from "@/app/components/Blog/CoverImage";
import { CategoryBadge } from "@/app/ui/CategoryBadge/CategoryBadge";
import { EyeIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import CoverField from "./CoverField";
import { Counter, FieldError } from "./fields";

export const BODY_MAX = 50_000;
const TITLE_MIN = 5;
const EXCERPT_MIN = 10;

interface Draft {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  /** Key of the uploaded image (see uploadImage), null if none. */
  cover_image: string | null;
  cover_alt: string;
}
type Field = keyof Draft;
type TextField = Exclude<Field, "cover_image">;
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY: Draft = {
  title: "",
  excerpt: "",
  body: "",
  category: "",
  cover_image: null,
  cover_alt: "",
};

/** Same rules as the API, checked before sending. */
export function validateArticle(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  const title = draft.title.trim();
  const excerpt = draft.excerpt.trim();
  if (title.length < TITLE_MIN) {
    errors.title = `Le titre doit faire au moins ${TITLE_MIN} caractères.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `${TITLE_MAX} caractères au maximum.`;
  }
  if (excerpt.length < EXCERPT_MIN) {
    errors.excerpt = `Le résumé doit faire au moins ${EXCERPT_MIN} caractères.`;
  } else if (excerpt.length > EXCERPT_MAX) {
    errors.excerpt = `${EXCERPT_MAX} caractères au maximum.`;
  }
  if (!draft.body.trim()) errors.body = "L’article est vide.";
  else if (draft.body.length > BODY_MAX) {
    errors.body = `${BODY_MAX} caractères au maximum.`;
  }
  if (!CATEGORIES.includes(draft.category)) {
    errors.category = "Choisissez une catégorie.";
  }
  if (draft.cover_image) {
    const alt = draft.cover_alt.trim();
    if (alt.length < ALT_MIN) {
      errors.cover_alt = "Décrivez l’image en quelques mots.";
    } else if (alt.length > ALT_MAX) {
      errors.cover_alt = `${ALT_MAX} caractères au maximum.`;
    }
  }
  return errors;
}

function toDraft(article?: ArticleDetail): Draft {
  if (!article) return EMPTY;
  const { title, excerpt, body, category } = article;
  return {
    title,
    excerpt,
    body,
    category,
    cover_image: article.cover_image ?? null,
    cover_alt: article.cover_alt ?? "",
  };
}

function sameDraft(a: Draft, b: Draft) {
  return (Object.keys(a) as Field[]).every((field) => a[field] === b[field]);
}

/**
 * Writes a new article, or edits `article`. The body is Markdown, with a
 * preview rendered exactly like the published page.
 */
export default function ArticleEditor({
  article,
}: Readonly<{ article?: ArticleDetail }>) {
  const router = useRouter();
  const tools = useAuthTools();
  const [saved, setSaved] = useState<ArticleDetail | undefined>(article);
  const [draft, setDraft] = useState<Draft>(() => toDraft(article));
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const dirty = !sameDraft(draft, toDraft(saved));
  const status: ArticleStatus = saved?.status ?? "draft";

  // Leaving the page (reload, close) with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    globalThis.addEventListener("beforeunload", warn);
    return () => globalThis.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (field: TextField) => (value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setNotice("");
  };

  // The image is sent as soon as it is chosen (the API checks and resizes
  // it), then saved with the article like any other field.
  const pickCover = async (file: File) => {
    setNotice("");
    const problem = imageFileProblem(file);
    setUploadError(problem ?? "");
    if (problem) return;
    setUploading(true);
    try {
      const { key } = await uploadImage(file, tools);
      setDraft((d) => ({ ...d, cover_image: key }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Envoi de l’image impossible.");
    } finally {
      setUploading(false);
    }
  };

  const removeCover = () => {
    setDraft((d) => ({ ...d, cover_image: null, cover_alt: "" }));
    setErrors((e) => ({ ...e, cover_alt: undefined }));
    setUploadError("");
    setNotice("");
  };

  const save = async (nextStatus: ArticleStatus) => {
    const found = validateArticle(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMode("write");
      return;
    }
    const input: ArticleInput = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body,
      category: draft.category,
      status: nextStatus,
      cover_image: draft.cover_image,
      cover_alt: draft.cover_image ? draft.cover_alt.trim() : null,
    };
    setSaving(true);
    setServerError("");
    try {
      if (saved) {
        const updated = await updateArticle(saved.id, input, tools);
        setSaved(updated);
        setDraft(toDraft(updated));
        setNotice(noticeFor(saved.status, updated.status));
      } else {
        const created = await createArticle(input, tools);
        setSaved(created);
        setDraft(toDraft(created));
        router.replace(`/redaction/${created.id}`);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const input = (field: "title" | "excerpt") => ({
    id: `article-${field}`,
    value: draft[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(field)(e.target.value),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `article-${field}-error` : undefined,
  });

  return (
    <form
      className="flex flex-col gap-5 lg:max-w-[880px] lg:pt-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save(status);
      }}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {status === "published" ? (
          <span className="n-tag n-tag-outline">Publié</span>
        ) : (
          <span className="n-tag n-tag-neutral">Brouillon</span>
        )}
        {dirty && (
          <span className="text-xs text-(--n-neutral-500)">
            Modifications non enregistrées
          </span>
        )}
        {saved?.status === "published" && (
          <Link
            href={`/blog/${saved.slug}`}
            className="n-link-arrow ml-auto min-h-0! text-[13px]!"
            target="_blank"
          >
            <EyeIcon size={15} />
            Voir l’article
          </Link>
        )}
      </div>

      <div className="n-field">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor="article-title">Titre</label>
          <Counter value={draft.title} max={TITLE_MAX} />
        </div>
        <input
          {...input("title")}
          className="n-text-input text-lg! font-medium"
          maxLength={TITLE_MAX}
          placeholder="Bitcoin franchit un nouveau record"
        />
        <FieldError id="article-title-error" message={errors.title} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="n-field">
          <label htmlFor="article-category">Catégorie</label>
          <select
            id="article-category"
            className="n-text-input"
            value={draft.category}
            onChange={(e) => set("category")(e.target.value)}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={errors.category ? "article-category-error" : undefined}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError id="article-category-error" message={errors.category} />
        </div>

        <div className="n-field">
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="article-excerpt">Résumé</label>
            <Counter value={draft.excerpt} max={EXCERPT_MAX} />
          </div>
          <textarea
            {...input("excerpt")}
            className="n-text-input min-h-[84px]! py-2.5! resize-y"
            maxLength={EXCERPT_MAX}
            placeholder="Deux phrases qui donnent envie de lire (affichées sur les cartes et dans Google)."
          />
          <FieldError id="article-excerpt-error" message={errors.excerpt} />
        </div>
      </div>

      <CoverField
        image={draft.cover_image}
        alt={draft.cover_alt}
        category={draft.category}
        uploading={uploading}
        disabled={saving}
        uploadError={uploadError}
        altError={errors.cover_alt}
        onPick={pickCover}
        onRemove={removeCover}
        onAltChange={set("cover_alt")}
      />

      <div className="n-field">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="n-label mb-0!" id="article-body-label">
            Contenu
          </span>
          <div className="n-seg" role="group" aria-label="Mode d’édition">
            <button
              type="button"
              className="n-seg-btn min-h-9! px-4!"
              aria-pressed={mode === "write"}
              onClick={() => setMode("write")}
            >
              Écrire
            </button>
            <button
              type="button"
              className="n-seg-btn min-h-9! px-4!"
              aria-pressed={mode === "preview"}
              onClick={() => setMode("preview")}
            >
              Aperçu
            </button>
          </div>
        </div>

        {mode === "write" ? (
          <>
            <textarea
              id="article-body"
              aria-labelledby="article-body-label"
              className="n-text-input min-h-[420px]! py-3! font-mono text-[14px]! leading-relaxed resize-y"
              value={draft.body}
              onChange={(e) => set("body")(e.target.value)}
              aria-invalid={errors.body ? true : undefined}
              aria-describedby="article-body-help"
              placeholder={"## Un intertitre\n\nVotre texte, en **Markdown**."}
            />
            <p id="article-body-help" className="mt-1.5 mb-0 text-xs text-(--n-neutral-500)">
              Markdown : <code>## Intertitre</code>, <code>**gras**</code>,{" "}
              <code>*italique*</code>, <code>[lien](https://…)</code>,{" "}
              <code>- liste</code>, <code>&gt; citation</code>.
            </p>
          </>
        ) : (
          <div className="n-card p-5 lg:p-8 min-h-[420px]" aria-label="Aperçu de l’article">
            {draft.cover_image && (
              <div className="relative mb-6 aspect-video overflow-hidden rounded-lg">
                <CoverImage
                  image={draft.cover_image}
                  alt={draft.cover_alt}
                  sizes="(min-width: 1024px) 880px, 100vw"
                />
              </div>
            )}
            {draft.category && <CategoryBadge category={draft.category} />}
            <h2 className="mt-2 mb-6 text-[26px] leading-tight">
              {draft.title || "Sans titre"}
            </h2>
            {draft.body.trim() ? (
              <ArticleBody markdown={draft.body} />
            ) : (
              <p className="m-0 text-(--n-neutral-500)">Rien à prévisualiser.</p>
            )}
          </div>
        )}
        <FieldError id="article-body-error" message={errors.body} />
      </div>

      {serverError && (
        <p role="alert" className="n-field-error m-0!">
          {serverError}
        </p>
      )}
      {notice && (
        <p role="status" className="m-0 text-sm text-(--n-up)">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {status === "draft" ? (
          <>
            <button
              type="button"
              className="n-btn n-btn-primary n-btn-lg"
              disabled={saving || uploading}
              onClick={() => save("published")}
            >
              Publier
            </button>
            <button
              type="submit"
              className="n-btn n-btn-secondary n-btn-lg"
              disabled={saving || uploading}
            >
              Enregistrer le brouillon
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              className="n-btn n-btn-primary n-btn-lg"
              disabled={saving || uploading}
            >
              Enregistrer
            </button>
            <button
              type="button"
              className="n-btn n-btn-secondary n-btn-lg"
              disabled={saving || uploading}
              onClick={() => save("draft")}
            >
              Dépublier
            </button>
          </>
        )}
        <Link
          href="/redaction"
          className="n-btn n-btn-lg ml-auto text-(--n-neutral-400)!"
          onClick={(e) => {
            if (dirty && !globalThis.confirm("Quitter sans enregistrer ?")) {
              e.preventDefault();
            }
          }}
        >
          {dirty ? "Annuler" : "Retour"}
        </Link>
      </div>
    </form>
  );
}

function noticeFor(before: ArticleStatus, after: ArticleStatus): string {
  if (before === "draft" && after === "published") return "Article publié.";
  if (before === "published" && after === "draft") {
    return "Article dépublié : il n’est plus visible sur le blog.";
  }
  return "Modifications enregistrées.";
}
