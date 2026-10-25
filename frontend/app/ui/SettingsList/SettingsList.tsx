const ROW_RULE =
  "linear-gradient(to right, transparent, color-mix(in srgb, var(--n-text) 8%, transparent) 48px, color-mix(in srgb, var(--n-text) 8%, transparent) calc(100% - 48px), transparent) no-repeat bottom / 100% 1px";

/** Settings list (Profil, Paramètres): one panel of labelled rows. */
export function SettingsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col n-panel ${className}`}>{children}</div>;
}

/**
 * One row: label on the left, content on the right (stacked below lg).
 * `last` drops the fading rule under the final row.
 */
export function SettingsRow({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-3 px-3.5 py-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-[22px]"
      style={last ? undefined : { background: ROW_RULE }}
    >
      <h2 className="m-0 text-[15px]">{title}</h2>
      {children}
    </div>
  );
}
