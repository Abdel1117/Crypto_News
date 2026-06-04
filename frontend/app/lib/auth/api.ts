import { RegistrationPayload } from "./registration";

export async function registerUser(payload: RegistrationPayload) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BACK_END}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(
      responseBody || "Impossible de créer le compte. Réessaie plus tard.",
    );
  }

  return res.json();
}
