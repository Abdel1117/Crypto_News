import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import authReducer, { type Role } from "@/app/lib/features/auth/authSlice";
import type {
  ArticleDetail,
  ArticleSummary,
  BlogComment,
} from "@/app/lib/api/blog";

export { jsonResponse } from "./simulationProTestUtils";

export function makeArticle(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  const id = overrides.id ?? 1;
  return {
    id,
    slug: `article-${id}`,
    title: `Article numéro ${id}`,
    excerpt: `Résumé de l’article ${id}.`,
    category: "Bitcoin",
    status: "published",
    author_name: "Alice Dupont",
    read_minutes: 4,
    published_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    like_count: 2,
    comment_count: 1,
    ...overrides,
  };
}

export function makeDetail(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
  return { ...makeArticle(overrides), body: "## Intro\n\nDu **Markdown**.", ...overrides };
}

export function makeComment(overrides: Partial<BlogComment> = {}): BlogComment {
  return {
    id: 1,
    article_id: 1,
    user_id: 9,
    author_name: "Rémi Lecteur",
    body: "Très clair, merci !",
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    ...overrides,
  };
}

/** A store with only the auth slice: logged out, or logged in as user 7 with `role`. */
export function makeAuthStore(role: Role | null = null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: role ? { id: "7", email: "me@example.com", fullName: "Moi Même", role } : null,
        accessToken: role ? "token-7" : null,
        expiresAt: role ? Date.now() + 3_600_000 : null,
        isAuthenticated: role !== null,
        initializing: false,
      },
    },
  });
}

export function renderWithAuth(ui: React.ReactElement, role: Role | null = null) {
  const store = makeAuthStore(role);
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
