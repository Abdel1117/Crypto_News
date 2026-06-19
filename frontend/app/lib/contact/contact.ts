export type ContactData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactFieldErrors = Partial<Record<keyof ContactData, string>>;

export type ContactResult = {
  success: boolean;
  message: string;
  fieldErrors?: ContactFieldErrors;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(data: ContactData): ContactResult {
  const fieldErrors: ContactFieldErrors = {};

  if (!data.name.trim()) {
    fieldErrors.name = "Le nom est requis.";
  }

  if (!data.email.trim()) {
    fieldErrors.email = "L'adresse e-mail est requise.";
  } else if (!EMAIL_RE.test(data.email)) {
    fieldErrors.email = "L'adresse e-mail n'est pas valide.";
  }

  if (!data.message.trim()) {
    fieldErrors.message = "Le message est requis.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Veuillez corriger les erreurs du formulaire.",
      fieldErrors,
    };
  }

  return { success: true, message: "Message envoyé avec succès." };
}
