"use client";

import type { CountryRule, ProPortfolio } from "@/app/lib/api/simulationPro";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { signedFiat, trendColor } from "@/app/components/Simulation/usePortfolio";
import { formatLongDate } from "./format";

interface TaxPanelProps {
  portfolio: ProPortfolio;
  rule: CountryRule | undefined;
}

/** Estimated tax per year with the rules of the user's country. */
export default function TaxPanel({ portfolio, rule }: Readonly<TaxPanelProps>) {
  const { tax, currency } = portfolio;
  const money = (v: number) => formatFiatPrice(v, currency);

  return (
    <section className="n-panel flex flex-col gap-3 px-5 py-4" aria-labelledby="tax-title">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="tax-title" className="m-0 mr-auto text-base">
          Fiscalité{rule ? ` : ${rule.name}` : ""}
        </h2>
        <span className="n-tag n-tag-neutral">Estimation</span>
      </div>

      {rule && <p className="m-0 text-sm leading-normal text-(--n-neutral-300)">{rule.summary}</p>}

      {tax.years.length === 0 ? (
        <p className="m-0 text-sm text-(--n-neutral-400)">
          Aucune vente pour le moment : l&apos;impôt ne porte que sur les plus-values réalisées.
        </p>
      ) : (
        <div role="table" aria-label="Impôt estimé par année" className="flex flex-col text-sm n-tnum">
          <div
            role="row"
            className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-3 py-1.5 text-[11px] tracking-[0.08em] uppercase text-[color-mix(in_srgb,var(--n-text)_60%,transparent)] border-b border-(--n-divider)"
          >
            <span role="columnheader">Année</span>
            <span role="columnheader" className="text-right">Plus-value nette</span>
            <span role="columnheader" className="text-right">Imposable</span>
            <span role="columnheader" className="text-right">Impôt estimé</span>
          </div>
          {tax.years.map((y) => (
            <div
              key={y.year}
              role="row"
              className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-3 py-2 border-b border-(--n-divider) last:border-b-0"
            >
              <span role="cell">
                {y.year}
                {y.exempt && <span className="ml-2 n-tag n-tag-neutral text-[11px]!">exonéré</span>}
              </span>
              <span role="cell" className="text-right" style={{ color: trendColor(y.net_gain) }}>
                {signedFiat(y.net_gain, currency)}
              </span>
              <span role="cell" className="text-right">{money(y.taxable_gain)}</span>
              <span role="cell" className="text-right font-medium">{money(y.tax)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-medium">
            <span>Total estimé</span>
            <span>{money(tax.total)}</span>
          </div>
        </div>
      )}

      {rule && rule.notes.length > 0 && (
        <ul className="m-0 pl-4 flex flex-col gap-1 text-xs leading-normal text-(--n-neutral-400)">
          {rule.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {tax.fx_estimated && (
        <p className="m-0 text-xs text-(--n-neutral-400)">
          Les seuils sont convertis avec un taux de change approximatif (taux du jour indisponible).
        </p>
      )}

      <p className="m-0 text-xs leading-normal text-(--n-neutral-500)">
        Estimation pour une simulation, pas un conseil fiscal. Les moins-values compensent les
        plus-values de la même année, sans report sur les années suivantes.
        {rule && (
          <>
            {" "}
            Règles vérifiées le {formatLongDate(rule.verified_on)} :{" "}
            {rule.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ", "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-(--n-text)">
                  {s.label}
                </a>
              </span>
            ))}
            .
          </>
        )}
      </p>
    </section>
  );
}
