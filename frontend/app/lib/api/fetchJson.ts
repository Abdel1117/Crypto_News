/** The API's own error text: `message` first, then FastAPI's `detail`. */
function apiErrorMessage(data: unknown): string | null | undefined {
  if (typeof data !== "object" || data === null) return null;
  if ("message" in data) return (data as { message?: string }).message;
  if ("detail" in data) return (data as { detail?: string }).detail;
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
