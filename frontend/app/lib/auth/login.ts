export type LoginData = {
  email: string;
  password: string;
};

export type SubscribeData = {
  fullname : string; 
  email : string;
  password: string; 
  confirmPassword : string;
}

export type LoginFieldErrors = Partial<Record<keyof LoginData, string>>;

export type LoginResult = {
  success: boolean;
  message: string;
  payload?: LoginData;
  fieldErrors?: LoginFieldErrors;
};

export type AuthTokens = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export function validateLogin(data: LoginData): LoginResult {
  const fieldErrors: LoginFieldErrors = {};

  if (!data.email.trim()) {
    fieldErrors.email = "Veuillez remplir l'adresse e-mail.";
  }

  if (!data.password.trim()) {
    fieldErrors.password = "Veuillez remplir le mot de passe.";
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
    message: "Connexion en cours...",
    payload: {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    },
  };
}
