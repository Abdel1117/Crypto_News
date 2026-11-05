import { InfoIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

/** Building blocks shared by the order forms of both simulations. */

export type OrderSide = "buy" | "sell";

const SIDES = [
  ["buy", "Acheter"],
  ["sell", "Vendre"],
] as const;

export function SideToggle({
  side,
  onChange,
}: Readonly<{ side: OrderSide; onChange: (next: OrderSide) => void }>) {
  return (
    <fieldset className="n-seg flex! min-w-0" aria-label="Sens de l’ordre">
      {SIDES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="n-seg-btn"
          aria-pressed={side === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}

export interface SummaryRow {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}

export function OrderSummary({ rows }: Readonly<{ rows: SummaryRow[] }>) {
  return (
    <dl className="m-0 flex flex-col gap-2 text-sm lg:text-[13px] n-tnum">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3">
          <dt className="text-(--n-neutral-400)">{r.label}</dt>
          <dd
            className={`m-0 ${r.strong ? "font-medium" : ""}`}
            style={r.color ? { color: r.color } : undefined}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Why the submit button is disabled, written out rather than just greyed out. */
export function OrderReason({ id, reason }: Readonly<{ id: string; reason: string | null }>) {
  if (!reason) return null;
  return (
    <output id={id} className="-mt-1 mb-0 flex gap-2 text-xs leading-normal text-(--n-neutral-400)">
      <InfoIcon size={14} className="flex-none mt-0.5" />
      {reason}
    </output>
  );
}
