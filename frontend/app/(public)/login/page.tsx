"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegistration } from "../../hooks/useRegistration";
import { useLogin } from "../../hooks/useLogin";
import { RegistrationData } from "../../lib/auth/registration";
import { LoginData } from "../../lib/auth/login";

const tabs = ["Connexion", "Inscription"] as const;

type Tab = (typeof tabs)[number];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function Login() {
  const router = useRouter();
  const { register, loading: registerLoading, result: registerResult } = useRegistration();
  const { login, loading: loginLoading, result: loginResult } = useLogin();

  const [activeTab, setActiveTab] = useState<Tab>("Connexion");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [notice, setNotice] = useState<string>("");

  const loading = activeTab === "Connexion" ? loginLoading : registerLoading;

  const onChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
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
    const result = await login(data);
    setNotice(result?.message ?? "");
    if (result.success) {
      router.push("/dashboard");
    }
  };

  const fieldErrors =
    activeTab === "Connexion"
      ? loginResult?.fieldErrors
      : registerResult?.fieldErrors;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 overflow-hidden rounded-4xl border border-white/10 bg-surface/95 shadow-[0_30px_120px_rgba(15,23,42,0.18)] backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-between gap-8 border-r border-white/10 bg-linear-to-b from-primary/10 to-transparent px-8 py-10 md:flex">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                Authentification
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Connectez-vous ou créez votre compte
              </h1>
              <p className="max-w-md text-sm leading-7 text-muted">
                Profitez de l'expérience Crypto News avec une page d'accès
                élégante et claire
              </p>

              {notice && (
                <div className="border-2 border-primary rounded-2xl  bg-primary/10 p-3 text-sm text-foreground">
                  {notice}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-3xl bg-background/80 p-6 shadow-lg shadow-black/5">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Avantages
                </p>
                <ul className="space-y-3 text-sm text-muted">
                  <li>• Accès rapide à votre dashboard et à vos favoris.</li>
                  <li>• Inscription sécurisée et fluide.</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-primary/10 p-4 text-sm text-primary">
                Connectez-vous pour suivre vos marchés et tendances en temps
                réel.
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    Authentification
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    {activeTab === "Connexion"
                      ? "Bienvenue de retour"
                      : "Créez votre compte"}
                  </h2>
                </div>
              </div>

              <div className="flex overflow-hidden rounded-3xl border border-white/10 bg-background/90 p-1 shadow-sm">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setNotice("");
                    }}
                    className={`flex-1 rounded-3xl px-4 py-3 text-sm font-semibold transition hover:cursor-pointer ${
                      activeTab === tab
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {activeTab === "Inscription" && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground/90"
                    htmlFor="fullname"
                  >
                    Nom complet
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    placeholder="Votre nom complet"
                    className={inputClass}
                    value={formData.fullname}
                    onChange={onChange("fullname")}
                  />
                  {fieldErrors?.fullname && (
                    <p className="text-sm text-red-500">{fieldErrors.fullname}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground/90"
                  htmlFor="email"
                >
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemple.com"
                  className={inputClass}
                  value={formData.email}
                  onChange={onChange("email")}
                />
                {fieldErrors?.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground/90"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  value={formData.password}
                  onChange={onChange("password")}
                />
                {fieldErrors?.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {activeTab === "Inscription" && (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground/90"
                    htmlFor="confirmPassword"
                  >
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={inputClass}
                    value={formData.confirmPassword}
                    onChange={onChange("confirmPassword")}
                  />
                  {fieldErrors?.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
              >
                {loading
                  ? "Patientez..."
                  : activeTab === "Connexion"
                    ? "Se connecter"
                    : "S'inscrire"}
              </button>

              <button
                type="button"
                onClick={() => setNotice("Connexion Google en cours...")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-background/90 hover:cursor-pointer"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.35 11.1H12v2.8h5.45c-.25 1.35-1 2.5-2.1 3.25l3.4 2.65c2-1.85 3.15-4.6 3.15-7.9 0-.7-.05-1.4-.15-2.05z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.7 0 4.95-.9 6.6-2.45l-3.4-2.65c-.95.65-2.2 1.05-3.2 1.05-2.45 0-4.5-1.65-5.25-3.9H3.1v2.45C4.75 19.95 8.15 22 12 22z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.75 13.05c-.2-.65-.3-1.35-.3-2.05s.1-1.4.3-2.05V6.5H3.1C2.35 8.15 2 9.95 2 12s.35 3.85 1.1 5.5l3.65-2.45z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.5c1.45 0 2.75.5 3.8 1.5l2.85-2.85C16.95 2.5 14.7 1.5 12 1.5 8.15 1.5 4.75 3.55 3.1 6.5l3.65 2.45C7.5 7.15 9.55 5.5 12 5.5z"
                      fill="#EA4335"
                    />
                  </svg>
                  Se connecter avec Google
                </span>
              </button>

              <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {activeTab === "Connexion"
                    ? "Pas encore de compte ?"
                    : "Vous avez déjà un compte ?"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      activeTab === "Connexion" ? "Inscription" : "Connexion",
                    );
                    setNotice("");
                  }}
                  className="font-semibold text-primary hover:text-secondary hover:cursor-pointer"
                >
                  {activeTab === "Connexion"
                    ? "Inscrivez-vous"
                    : "Connectez-vous"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
