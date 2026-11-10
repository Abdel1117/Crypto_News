"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import { searchUsers, setUserRole, type TeamMember } from "@/app/lib/api/blog";
import type { Role } from "@/app/lib/features/auth/authSlice";
import { initialOf } from "@/app/components/Blog/format";
import { SearchIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "user", label: "Lecteur" },
  { value: "editor", label: "Éditeur" },
  { value: "admin", label: "Admin" },
];

const SEARCH_DELAY_MS = 300;

function MemberRow({
  member,
  isMe,
  onChange,
}: Readonly<{
  member: TeamMember;
  isMe: boolean;
  onChange: (member: TeamMember, role: Role) => void;
}>) {
  return (
    <li className="relative flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center lg:px-5">
      <div className="n-rule" />
      <span
        aria-hidden="true"
        className="hidden sm:grid w-9 h-9 flex-none rounded-full place-items-center text-[13px] font-medium bg-(--n-accent-800) text-(--n-accent-100)"
      >
        {initialOf(member.full_name || member.email)}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[15px] font-medium truncate">
          {member.full_name}
          {isMe && (
            <span className="ml-2 text-xs font-normal text-(--n-neutral-500)">(vous)</span>
          )}
        </span>
        <span className="text-[13px] text-(--n-neutral-500) truncate">{member.email}</span>
      </div>
      <div
        className="n-seg self-start sm:self-auto"
        role="group"
        aria-label={`Rôle de ${member.full_name || member.email}`}
      >
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="n-seg-btn min-h-9! px-3.5!"
            aria-pressed={member.role === option.value}
            // An admin can't remove their own admin role (the API refuses too).
            disabled={isMe && option.value !== "admin"}
            onClick={() => {
              if (member.role !== option.value) onChange(member, option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </li>
  );
}

/** Admins search accounts and choose who writes on the blog. */
export default function TeamManager() {
  const tools = useAuthTools();
  const myId = useAppSelector((s) => s.auth.user?.id);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(query.trim(), tools)
        .then((found) => {
          if (!cancelled) {
            setMembers(found);
            setError("");
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Recherche impossible.");
          }
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tools]);

  const changeRole = async (member: TeamMember, role: Role) => {
    setNotice("");
    try {
      const updated = await setUserRole(member.id, role, tools);
      setMembers((prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? null);
      setError("");
      setNotice(
        `${updated.full_name || updated.email} est maintenant ${
          ROLE_OPTIONS.find((o) => o.value === updated.role)?.label.toLowerCase()
        }. Ses nouveaux menus apparaîtront au prochain chargement de page.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Changement impossible.");
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-[880px] lg:pt-2">
      <p className="m-0 text-[15px] leading-relaxed text-(--n-neutral-400) max-w-[62ch]">
        Les <strong className="text-(--n-text) font-medium">éditeurs</strong> écrivent,
        modifient et suppriment les articles et modèrent les commentaires. Les{" "}
        <strong className="text-(--n-text) font-medium">admins</strong> font de même et
        gèrent l’équipe.
      </p>

      <div className="n-field max-w-[420px]">
        <label htmlFor="team-search">Rechercher un compte</label>
        <div className="relative">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--n-neutral-500) pointer-events-none"
          />
          <input
            id="team-search"
            type="search"
            className="n-text-input pl-9!"
            placeholder="Nom ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="n-field-error m-0!">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="m-0 text-sm text-(--n-up)">
          {notice}
        </p>
      )}

      {members === null && !error && (
        <div className="n-skeleton h-40" aria-busy="true" aria-label="Chargement" />
      )}
      {members?.length === 0 && (
        <p className="m-0 text-sm text-(--n-neutral-500)">Aucun compte trouvé.</p>
      )}
      {members && members.length > 0 && (
        <ul className="n-card list-none m-0 p-0 overflow-hidden [&>li:first-child>.n-rule]:hidden">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              isMe={String(m.id) === myId}
              onChange={changeRole}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
