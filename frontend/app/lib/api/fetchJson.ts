/**
 * The API's own error text: `message` first, then FastAPI's `detail`, which
 * is a string or a list of validation errors.
 */
function apiErrorMessage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  if ("message" in data && typeof data.message === "string") return data.message;
  if (!("detail" in data)) return null;
  const detail = data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
    return detail[0].msg.replace(/^Value error, /, "");
  }
  return null;
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = apiErrorMessage(data);

    throw new Error(
      message || `Erreur ${res.status} lors de la requête vers ${url}`,
    );
  }

  return data as T;
}
