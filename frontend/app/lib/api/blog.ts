import { authFetchJson, type ThunkTools } from "../auth/authFetch";
import type { Role } from "../features/auth/authSlice";
import { fetchJson } from "./fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;

export type ArticleStatus = "draft" | "published";

export interface ArticleSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: ArticleStatus;
  author_name: string;
  read_minutes: number;
  published_at: string | null;
  updated_at: string;
  like_count: number;
  comment_count: number;
  /** Key of the cover image (see coverUrl), with its text alternative. */
  cover_image: string | null;
  cover_alt: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  body: string;
}

export interface ArticlesPage {
  items: ArticleSummary[];
  total: number;
}

export interface BlogComment {
  id: number;
  article_id: number;
  user_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

export interface CommentsPage {
  items: BlogComment[];
  total: number;
}

export interface ReactionState {
  liked: boolean;
  favorited: boolean;
  like_count: number;
}

export interface ArticleInput {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  status: ArticleStatus;
  /** null: no image (removes the current one). */
  cover_image: string | null;
  cover_alt: string | null;
}

export const TITLE_MAX = 160;
export const EXCERPT_MAX = 300;
export const COMMENT_MAX = 2000;
export const COMMENTS_PAGE = 20;

// Same limits as the API (services/blog/images.py, schemas/blog.py).
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALT_MIN = 3;
export const ALT_MAX = 200;

/**
 * URL of a cover image. The API stores two WebP files per image: "large"
 * (1600 px at most, article page and social networks) and "small" (640 px,
 * cards). Same public URL for the browser and the Next server.
 */
export function coverUrl(key: string, size: "large" | "small" = "large"): string {
  return `${API}/media/blog/${key}${size === "small" ? "-sm" : ""}.webp`;
}

/** Why `file` can't be sent as a cover image, or null if it can. */
export function imageFileProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Format non accepté : choisissez une image JPEG, PNG ou WebP.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Image trop lourde : 5 Mo au maximum.";
  }
  return null;
}

// ---------- server side (pages rendered by Next) ----------

/**
 * Inside Docker the browser URL (/api) means nothing to the Next server: it
 * calls the backend container directly when API_INTERNAL_URL is set.
 */
function serverApi(): string {
  return process.env.API_INTERNAL_URL || API || "";
}

/** Public data, cached one minute by Next: a new article shows within 60 s. */
const CACHED: RequestInit = { next: { revalidate: 60 } } as RequestInit;

export function fetchPublishedArticles(
  category?: string,
  limit = 30,
): Promise<ArticlesPage> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (category) query.set("category", category);
  return fetchJson(`${serverApi()}/blog/articles?${query}`, CACHED);
}

/** The article, or null if it doesn't exist or isn't published. */
export async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const res = await fetch(
    `${serverApi()}/blog/articles/${encodeURIComponent(slug)}`,
    CACHED,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement de l'article`);
  return res.json();
}

export function fetchRelatedArticles(
  articleId: number,
  limit = 3,
): Promise<ArticleSummary[]> {
  return fetchJson(
    `${serverApi()}/blog/articles/${articleId}/related?limit=${limit}`,
    CACHED,
  );
}

// ---------- browser, public ----------

export function fetchComments(
  articleId: number,
  offset = 0,
): Promise<CommentsPage> {
  return fetchJson(
    `${API}/blog/articles/${articleId}/comments?limit=${COMMENTS_PAGE}&offset=${offset}`,
  );
}

// ---------- browser, logged in ----------

export function fetchMyReactions(articleId: number, tools: ThunkTools) {
  return authFetchJson<ReactionState>(
    `${API}/blog/articles/${articleId}/me`,
    { method: "GET" },
    tools,
  );
}

export function setLike(articleId: number, on: boolean, tools: ThunkTools) {
  return authFetchJson<ReactionState>(
    `${API}/blog/articles/${articleId}/like`,
    { method: on ? "PUT" : "DELETE" },
    tools,
  );
}

export function setFavorite(articleId: number, on: boolean, tools: ThunkTools) {
  return authFetchJson<ReactionState>(
    `${API}/blog/articles/${articleId}/favorite`,
    { method: on ? "PUT" : "DELETE" },
    tools,
  );
}

export function postComment(articleId: number, body: string, tools: ThunkTools) {
  return authFetchJson<BlogComment>(
    `${API}/blog/articles/${articleId}/comments`,
    { method: "POST", body: JSON.stringify({ body }) },
    tools,
  );
}

export function deleteComment(commentId: number, tools: ThunkTools) {
  return authFetchJson<null>(
    `${API}/blog/comments/${commentId}`,
    { method: "DELETE" },
    tools,
  );
}

export function fetchFavorites(tools: ThunkTools) {
  return authFetchJson<ArticleSummary[]>(
    `${API}/blog/favorites`,
    { method: "GET" },
    tools,
  );
}

export function fetchRecommendations(tools: ThunkTools, limit = 4) {
  return authFetchJson<ArticleSummary[]>(
    `${API}/blog/recommendations?limit=${limit}`,
    { method: "GET" },
    tools,
  );
}

// ---------- editors and admins ----------

export function fetchManagedArticles(
  tools: ThunkTools,
  status?: ArticleStatus,
) {
  const query = status ? `?status=${status}` : "";
  return authFetchJson<ArticlesPage>(
    `${API}/blog/manage/articles${query}`,
    { method: "GET" },
    tools,
  );
}

export function fetchManagedArticle(id: number, tools: ThunkTools) {
  return authFetchJson<ArticleDetail>(
    `${API}/blog/manage/articles/${id}`,
    { method: "GET" },
    tools,
  );
}

export function createArticle(input: ArticleInput, tools: ThunkTools) {
  return authFetchJson<ArticleDetail>(
    `${API}/blog/manage/articles`,
    { method: "POST", body: JSON.stringify(input) },
    tools,
  );
}

export function updateArticle(
  id: number,
  changes: Partial<ArticleInput>,
  tools: ThunkTools,
) {
  return authFetchJson<ArticleDetail>(
    `${API}/blog/manage/articles/${id}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    tools,
  );
}

/** Sends an image; its key then goes in the article's cover_image. */
export function uploadImage(file: File, tools: ThunkTools) {
  const form = new FormData();
  form.append("file", file);
  return authFetchJson<{ key: string }>(
    `${API}/blog/manage/images`,
    { method: "POST", body: form },
    tools,
  );
}

export function deleteArticle(id: number, tools: ThunkTools) {
  return authFetchJson<null>(
    `${API}/blog/manage/articles/${id}`,
    { method: "DELETE" },
    tools,
  );
}

// ---------- admins ----------

export interface TeamMember {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  created_at: string;
}

export function searchUsers(query: string, tools: ThunkTools) {
  return authFetchJson<TeamMember[]>(
    `${API}/admin/users?query=${encodeURIComponent(query)}`,
    { method: "GET" },
    tools,
  );
}

export function setUserRole(userId: number, role: Role, tools: ThunkTools) {
  return authFetchJson<TeamMember>(
    `${API}/admin/users/${userId}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    tools,
  );
}
