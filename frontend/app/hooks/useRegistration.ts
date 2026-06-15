"use client";

import { useState } from "react";
import {
  RegistrationData,
  RegistrationResult,
  validateRegistration,
} from "../lib/auth/registration";
import { registerUser } from "../lib/auth/api";

export function useRegistration() {
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    const validation = validateRegistration(data);
    if (!validation.success) {
      setResult(validation);
      return validation;
    }

    setLoading(true);
    try {
      const response  = await registerUser(validation.payload!);
      const successResult: RegistrationResult = {
        success: true,
        message: response?.message ?? "Inscription réussie.",
        payload: validation.payload,
      };
      setResult(successResult);
      return successResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'inscription.";

      const failureResult: RegistrationResult = {
        success: false,
        message: errorMessage,
      };

      setResult(failureResult);
      return failureResult;
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    result,
    loading,
    message: result?.message ?? "",
    success: result?.success ?? false,
  };
}
