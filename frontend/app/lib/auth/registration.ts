export type RegistrationData = {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegistrationPayload = {
  fullname: string;
  email: string;
  password: string;
};

export type RegistrationFieldErrors = Partial<Record<keyof RegistrationData, string>>;

export type RegistrationResult = {
  success: boolean;
  message: string;
  payload?: RegistrationPayload;
  fieldErrors?: RegistrationFieldErrors;
};

function trimValue(value: string) {
  return value.trim();
}

function isValidEmail(value: string): boolean {
  const trimmed = trimValue(value);
  return trimmed.includes("@") && trimmed.includes(".") && trimmed.length >= 6;
}

function passwordsMatch(data: RegistrationData): boolean {
  return data.password === data.confirmPassword;
}

export function validateRegistration(data: RegistrationData): RegistrationResult {
  const fieldErrors: RegistrationFieldErrors = {};

  if (trimValue(data.fullname).length === 0) {
    fieldErrors.fullname = "Veuillez remplir le nom complet.";
  }

  if (trimValue(data.email).length === 0) {
    fieldErrors.email = "Veuillez remplir l'adresse e-mail.";
  } else if (!isValidEmail(data.email)) {
    fieldErrors.email = "Merci d’indiquer une adresse e-mail valide.";
  }

  if (trimValue(data.password).length === 0) {
    fieldErrors.password = "Veuillez remplir le mot de passe.";
  } else if (data.password.length < 8) {
    fieldErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }

  if (trimValue(data.confirmPassword).length === 0) {
    fieldErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
  } else if (!passwordsMatch(data)) {
    fieldErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Veuillez corriger les erreurs du formulaire.",
      fieldErrors,
    };
  }

  return {
    success: true,
    message: "Inscription en cours...",
    payload: {
      fullname: trimValue(data.fullname),
      email: trimValue(data.email).toLowerCase(),
      password: data.password,
    },
  };
}
