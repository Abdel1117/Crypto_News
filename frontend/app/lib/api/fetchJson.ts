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
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? (data as { message?: string }).message
        : typeof data === "object" && data !== null && "detail" in data
        ? (data as { detail?: string }).detail
        : null;

    throw new Error(
      message || `Erreur ${res.status} lors de la requête vers ${url}`,
    );
  }

  return data as T;
}
