"use client";

import { useState } from "react";
import { loginUser } from "../lib/auth/api";
import { LoginData, LoginResult, validateLogin } from "../lib/auth/login";
import { loginSuccess } from "../lib/features/auth/authSlice";
import { useAppDispatch } from "../lib/hooks";

export function useLogin() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);

  const login = async (data: LoginData): Promise<LoginResult> => {
    const validation = validateLogin(data);
    if (!validation.success) {
      setResult(validation);
      return validation;
    }

    setLoading(true);
    try {
      const tokens = await loginUser(validation.payload!);

      dispatch(loginSuccess({ accessToken: tokens.access_token }));

      const successResult: LoginResult = {
        success: true,
        message: "Connexion réussie. Bienvenue !",
      };
      setResult(successResult);
      return successResult;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la connexion.";

      const failureResult: LoginResult = { success: false, message };
      setResult(failureResult);
      return failureResult;
    } finally {
      setLoading(false);
    }
  };

  return { login, result, loading };
}
