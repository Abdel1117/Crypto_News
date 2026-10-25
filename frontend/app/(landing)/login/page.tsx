"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegistration } from "../../hooks/useRegistration";
import { useLogin } from "../../hooks/useLogin";
import {
  RegistrationData,
  RegistrationFieldErrors,
} from "../../lib/auth/registration";
import { LoginData } from "../../lib/auth/login";
import { useAppSelector } from "@/app/lib/hooks";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useGoogleLogin } from "@/app/hooks/useGoogleLogin";
import LoginShowcase from "@/app/components/Landing/LoginShowcase";
import {
  ArrowLeftIcon,
  BrandMark,
  EyeIcon,
  EyeSlashIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

const tabs = ["Connexion", "Inscription"] as const;

type Tab = (typeof tabs)[number];

type FieldName = keyof RegistrationFieldErrors;

// Google renders its button in an iframe with a fixed pixel width (max 400),
// so we track the form's width and hand it over.
function useElementWidth<T extends HTMLElement>(max: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(max);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(max, Math.floor(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [max]);

  return { ref, width };
}

function PasswordInput({
  id,
  value,
  onChange,
  invalid,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  invalid: boolean;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        placeholder="••••••••"
        autoComplete={autoComplete}
        className="n-text-input pr-12!"
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      />
      <button
        type="button"
        className="n-btn n-btn-icon absolute right-0.5 top-0.5 w-11! h-11! lg:w-9! lg:h-9! lg:right-[3px] lg:top-[3px] text-(--n-neutral-400)! hover:text-(--n-text)!"
        onClick={() => setVisible((v) => !v)}
        aria-label={
          visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-pressed={visible}
      >
        {visible ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="n-field-error">
      {message}
    </p>
  );
}

export default function Login() {
  const router = useRouter();
  const {
    register,
    loading: registerLoading,
    result: registerResult,
  } = useRegistration();
  const { login, loading: loginLoading, result: loginResult } = useLogin();

  const { loginGoogle, loading: googleLoading } = useGoogleLogin();

  const { isAuthenticated, initializing } = useAppSelector(
    (state) => state.auth,
  );
  // Set while this page logs the user in: its own redirect (/dashboard) wins
  // over the « already signed in » one below.
  const signingInHere = useRef(false);

  const [activeTab, setActiveTab] = useState<Tab>("Connexion");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [notice, setNotice] = useState<string>("");
  const { ref: formRef, width: googleWidth } =
    useElementWidth<HTMLDivElement>(400);

  const isLogin = activeTab === "Connexion";
  const loading = isLogin ? loginLoading || googleLoading : registerLoading;

  const onChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setNotice("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeTab === "Inscription") {
      const data: RegistrationData = {
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      const result = await register(data);
      setNotice(result?.message ?? "");
      if (result.success) {
        setActiveTab("Connexion");
        setFormData((prev) => ({ ...prev, fullname: "", confirmPassword: "" }));
      }
      return;
    }

    const data: LoginData = {
      email: formData.email,
      password: formData.password,
    };
    signingInHere.current = true;
    const result = await login(data);
    setNotice(result?.message ?? "");
    if (result.success) {
      router.push("/dashboard");
    } else {
      signingInHere.current = false;
    }
  };

  const handleSubmitWithGoogle = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (credentialResponse.credential != undefined) {
      signingInHere.current = true;
      const result = await loginGoogle(credentialResponse?.credential);
      setNotice(result.message);
      if (result.success) {
        router.push("/dashboard");
      } else {
        signingInHere.current = false;
      }
    }
  };

  const fieldErrors: RegistrationFieldErrors | undefined = isLogin
    ? loginResult?.fieldErrors
    : registerResult?.fieldErrors;
  const hasError = (field: FieldName) => Boolean(fieldErrors?.[field]);

  // Already signed in (session restored from the refresh cookie): leave the
  // page once the session check is over, not just on mount.
  useEffect(() => {
    if (!initializing && isAuthenticated && !signingInHere.current) {
      router.replace("/profil");
    }
  }, [initializing, isAuthenticated, router]);

  return (
    <div className="min-h-screen lg:h-screen lg:min-h-[640px] lg:grid lg:grid-cols-[600px_minmax(0,1fr)]">
      <main className="flex flex-col min-h-screen lg:min-h-0 px-5 pt-2 pb-6 lg:px-[72px] lg:py-7 lg:overflow-y-auto">
        <div className="flex items-center gap-2 h-[52px] lg:gap-2.5 lg:h-auto">
          <Link
            href="/"
            className="n-btn n-btn-icon w-11! h-11! -ml-3 text-(--n-neutral-300)! lg:hidden!"
            aria-label="Retour à l’accueil"
          >
            <ArrowLeftIcon size={20} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 lg:gap-2.5 no-underline text-(--n-text)!"
          >
            <BrandMark size={24} />
            <span className="text-[15px] lg:text-base font-medium whitespace-nowrap">
              Crypto-Explorer
            </span>
          </Link>
          <Link
            href="/"
            className="n-btn ml-auto max-lg:hidden! px-1! text-(--n-neutral-400)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
          >
            <ArrowLeftIcon />
            Accueil
          </Link>
        </div>

        <div
          ref={formRef}
          className="w-full max-w-[400px] mt-6 flex flex-col gap-3.5 lg:my-auto lg:gap-5"
        >
          <div className={isLogin ? "mt-3 lg:mt-0" : undefined}>
            <h1 className="m-0 text-[30px] lg:text-[34px] leading-[1.12]">
              {isLogin ? "Bon retour" : "Créez votre compte"}
            </h1>
            <p className="mt-2 mb-0 text-[15px] leading-[1.55] text-(--n-neutral-400)">
              {isLogin
                ? "Connectez-vous pour suivre vos marchés et tendances en temps réel."
                : "Accès rapide à votre dashboard et à vos favoris."}
            </p>
          </div>

          <div className="n-seg flex!" role="group" aria-label="Mode d’accès">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className="n-seg-btn"
                aria-pressed={activeTab === tab}
                onClick={() => switchTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {notice && (
            <p
              role="status"
              className="m-0 px-3 py-2.5 rounded-lg text-sm border border-(--n-accent) bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
            >
              {notice}
            </p>
          )}

          <div className="flex justify-center min-h-10 [color-scheme:normal]">
            <GoogleLogin
              theme="filled_black"
              text="continue_with"
              shape="rectangular"
              width={googleWidth}
              onSuccess={(credentialResponse: CredentialResponse) => {
                handleSubmitWithGoogle(credentialResponse);
              }}
              onError={() => {
                setNotice(
                  "Une erreur lors de l'authentification avec google est survenu",
                );
              }}
            />
          </div>

          <div
            className="flex items-center gap-3 text-xs text-(--n-neutral-500)"
            aria-hidden="true"
          >
            <span className="flex-1 h-px bg-[linear-gradient(to_right,transparent,var(--n-divider))]" />
            ou
            <span className="flex-1 h-px bg-[linear-gradient(to_left,transparent,var(--n-divider))]" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5"
            noValidate
          >
            {!isLogin && (
              <div className="n-field">
                <label htmlFor="fullname">Nom complet</label>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  placeholder="Votre nom complet"
                  autoComplete="name"
                  className="n-text-input"
                  value={formData.fullname}
                  onChange={onChange("fullname")}
                  aria-invalid={hasError("fullname")}
                  aria-describedby={
                    hasError("fullname") ? "fullname-error" : undefined
                  }
                />
                <FieldError id="fullname" message={fieldErrors?.fullname} />
              </div>
            )}

            <div className="n-field">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="email@exemple.com"
                autoComplete="email"
                className="n-text-input"
                value={formData.email}
                onChange={onChange("email")}
                aria-invalid={hasError("email")}
                aria-describedby={hasError("email") ? "email-error" : undefined}
              />
              <FieldError id="email" message={fieldErrors?.email} />
            </div>

            <div className="n-field">
              <label htmlFor="password">Mot de passe</label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={onChange("password")}
                invalid={hasError("password")}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <FieldError id="password" message={fieldErrors?.password} />
            </div>

            {!isLogin && (
              <div className="n-field">
                <label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="n-text-input"
                  value={formData.confirmPassword}
                  onChange={onChange("confirmPassword")}
                  aria-invalid={hasError("confirmPassword")}
                  aria-describedby={
                    hasError("confirmPassword")
                      ? "confirmPassword-error"
                      : undefined
                  }
                />
                <FieldError
                  id="confirmPassword"
                  message={fieldErrors?.confirmPassword}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="n-btn n-btn-primary w-full min-h-12 lg:min-h-[42px] text-[15px]! mt-1"
            >
              {loading ? "Patientez…" : isLogin ? "Se connecter" : "S’inscrire"}
            </button>
          </form>
        </div>

        <nav
          className="mt-auto pt-8 lg:mt-0 lg:pt-0 flex justify-center lg:justify-start gap-[18px] text-xs"
          aria-label="Liens légaux"
        >
          <Link
            href="/mentions-legales"
            className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-500)! hover:text-(--n-accent)!"
          >
            Mentions légales
          </Link>
          <Link
            href="/politique-de-confidentialite"
            className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-500)! hover:text-(--n-accent)!"
          >
            Politique de confidentialité
          </Link>
        </nav>
      </main>

      <LoginShowcase />
    </div>
  );
}
