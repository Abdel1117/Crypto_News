"use client";

import { useState } from "react";
import {
  ContactData,
  ContactFieldErrors,
  ContactResult,
  validateContact,
} from "../lib/contact/contact";

const EMPTY_FIELDS: ContactData = { name: "", email: "", phone: "", message: "" };

export function useContactForm() {
  const [fields, setFields] = useState<ContactData>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [result, setResult] = useState<ContactResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange =
    (key: keyof ContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const submit = async (): Promise<ContactResult> => {
    const validation = validateContact(fields);

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors ?? {});
      setResult(validation);
      return validation;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const success: ContactResult = { success: true, message: validation.message };
      setResult(success);
      return success;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFields(EMPTY_FIELDS);
    setFieldErrors({});
    setResult(null);
  };

  return {
    fields,
    fieldErrors,
    loading,
    sent: result?.success ?? false,
    onChange,
    submit,
    reset,
  };
}
