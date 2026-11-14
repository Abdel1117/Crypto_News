"""Estimated tax on crypto gains, per country of residence.

These are deliberately simple *estimates* for a simulation: one typical rate
per country (and per holding period where the law distinguishes it), plus the
main yearly exemption. Income-dependent rates use a typical bracket. Every
value was checked against the sources listed with it on `VERIFIED_ON`;
rates change, so re-check them before relying on this file.

Amounts in a rule (exemptions, brackets) are in the rule's `amounts_currency`
and are converted to the portfolio's currency when the tax is estimated.
"""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Literal

VERIFIED_ON = date(2026, 11, 2)

# How the cost of what is sold is determined.
Method = Literal["france_global", "fifo", "lifo", "average", "none"]

# How the yearly exemption works:
# - "sales_total_max": the whole year is exempt if total sales (gross) stay at
#   or under the amount (France, 305 €).
# - "allowance": the amount is deducted from the year's net gain (Belgium, UK).
# - "short_term_free_limit": short-term gains are exempt while their yearly net
#   total stays under the amount; at or above it, all of it is taxed (Germany's
#   Freigrenze).
ExemptionKind = Literal["sales_total_max", "allowance", "short_term_free_limit"]


@dataclass(frozen=True)
class Exemption:
    kind: ExemptionKind
    amount: Decimal


@dataclass(frozen=True)
class Source:
    label: str
    url: str


@dataclass(frozen=True)
class TaxRule:
    code: str
    name: str  # French, shown in the UI
    default_currency: Literal["eur", "usd"]
    method: Method
    amounts_currency: Literal["eur", "usd", "gbp"]
    summary: str  # one sentence, French
    # One of: a flat rate, short/long-term rates, or progressive brackets.
    flat_rate: Decimal | None = None
    short_term_rate: Decimal | None = None
    long_term_rate: Decimal | None = None  # applies when held more than 1 year
    # (upper bound of the bracket or None for the last one, rate)
    brackets: tuple[tuple[Decimal | None, Decimal], ...] = ()
    exemption: Exemption | None = None
    tax_year_start: tuple[int, int] = (1, 1)  # (month, day)
    notes: tuple[str, ...] = ()
    sources: tuple[Source, ...] = field(default_factory=tuple)


D = Decimal

COMMON_NOTE = (
    "Estimation pour une simulation, pas un conseil fiscal. Les moins-values "
    "compensent les plus-values de la même année, sans report sur les années suivantes."
)

TAX_RULES: dict[str, TaxRule] = {
    "FR": TaxRule(
        code="FR",
        name="France",
        default_currency="eur",
        method="france_global",
        amounts_currency="eur",
        flat_rate=D("0.314"),
        exemption=Exemption("sales_total_max", D("305")),
        summary=(
            "Flat tax de 31,4 % (12,8 % d'impôt + 18,6 % de prélèvements sociaux) "
            "sur la plus-value nette de l'année, calculée avec la formule officielle "
            "(art. 150 VH bis du CGI). Exonération si le total des ventes de l'année "
            "ne dépasse pas 305 €."
        ),
        notes=(
            "La plus-value de chaque vente tient compte de la valeur de tout le "
            "portefeuille crypto au moment de la vente, pas seulement du jeton vendu.",
            "L'option pour le barème progressif n'est pas simulée.",
        ),
        sources=(
            Source("impots.gouv.fr – Les cessions mobilières", "https://www.impots.gouv.fr/particulier/les-cessions-mobilieres"),
            Source("Service-public – Taux du PFU en 2026", "https://entreprendre.service-public.gouv.fr/actualites/A18796"),
        ),
    ),
    "BE": TaxRule(
        code="BE",
        name="Belgique",
        default_currency="eur",
        method="fifo",
        amounts_currency="eur",
        flat_rate=D("0.10"),
        exemption=Exemption("allowance", D("10000")),
        summary=(
            "10 % sur la plus-value nette de l'année au-delà de 10 000 € "
            "(taxe sur les plus-values en vigueur depuis le 1er janvier 2026, "
            "gestion normale du patrimoine privé). Coût des ventes en FIFO."
        ),
        notes=(
            "Le régime spéculatif (33 %) et la hausse possible de l'abattement ne sont pas simulés.",
        ),
        sources=(
            Source("Belgium.be – Impôt sur les plus-values sur actifs financiers", "https://news.belgium.be/fr/introduction-dun-impot-sur-les-plus-values-sur-les-actifs-financiers"),
            Source("KPMG – Méthode FIFO", "https://kpmg.com/be/en/insights/my-tax-compass/corporate-tax-insights/administrative-guidance-on-capital-gains-tax-published.html"),
        ),
    ),
    "CH": TaxRule(
        code="CH",
        name="Suisse",
        default_currency="eur",
        method="none",
        amounts_currency="eur",
        flat_rate=D("0"),
        summary=(
            "Pas d'impôt sur les plus-values pour un investisseur privé "
            "(gains en capital de la fortune privée non imposables)."
        ),
        notes=(
            "L'impôt cantonal sur la fortune et le statut de commerçant professionnel ne sont pas simulés.",
            "Le franc suisse n'est pas proposé : le portefeuille est en euros ou en dollars.",
        ),
        sources=(
            Source("AFC – Cryptomonnaies", "https://www.estv.admin.ch/estv/fr/accueil/impot-federal-direct/informations-specialisees-ifd/cryptomonnaies.html"),
        ),
    ),
    "DE": TaxRule(
        code="DE",
        name="Allemagne",
        default_currency="eur",
        method="fifo",
        amounts_currency="eur",
        short_term_rate=D("0.30"),
        long_term_rate=D("0"),
        exemption=Exemption("short_term_free_limit", D("1000")),
        summary=(
            "Gains exonérés après plus d'un an de détention. Avant un an, imposés au "
            "taux personnel (30 % retenu comme taux typique), sauf si le gain net de "
            "l'année reste sous 1 000 €. Coût des ventes en FIFO."
        ),
        notes=(
            "Au-delà de 1 000 € de gain à court terme, tout le gain est imposé (Freigrenze).",
        ),
        sources=(
            Source("§ 23 EStG", "https://www.gesetze-im-internet.de/estg/__23.html"),
            Source("BMF – Kryptowerte (2025)", "https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Einkommensteuer/2025-03-06-einzelfragen-kryptowerte-bmf-schreiben.pdf?__blob=publicationFile&v=2"),
        ),
    ),
    "ES": TaxRule(
        code="ES",
        name="Espagne",
        default_currency="eur",
        method="fifo",
        amounts_currency="eur",
        brackets=(
            (D("6000"), D("0.19")),
            (D("50000"), D("0.21")),
            (D("200000"), D("0.23")),
            (D("300000"), D("0.27")),
            (None, D("0.30")),
        ),
        summary=(
            "Barème de l'épargne sur la plus-value nette de l'année : 19 % jusqu'à "
            "6 000 €, puis 21 %, 23 %, 27 % et 30 % au-delà de 300 000 €. "
            "Coût des ventes en FIFO."
        ),
        sources=(
            Source("Agencia Tributaria – Gravamen de la base del ahorro", "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-ahorro/gravamen-estatal.html"),
        ),
    ),
    "IT": TaxRule(
        code="IT",
        name="Italie",
        default_currency="eur",
        method="lifo",
        amounts_currency="eur",
        flat_rate=D("0.33"),
        summary=(
            "33 % sur la plus-value nette de l'année depuis le 1er janvier 2026, "
            "sans seuil d'exonération. Coût des ventes en LIFO (régime déclaratif)."
        ),
        sources=(
            Source("Agenzia delle Entrate – Istruzioni Redditi PF 2026", "https://infoprecompilata.agenziaentrate.gov.it/portale/documents/d/guest/pf2_istruzioni_2026.pdf"),
        ),
    ),
    "GB": TaxRule(
        code="GB",
        name="Royaume-Uni",
        default_currency="eur",
        method="average",
        amounts_currency="gbp",
        flat_rate=D("0.18"),
        exemption=Exemption("allowance", D("3000")),
        tax_year_start=(4, 6),
        summary=(
            "Capital Gains Tax de 18 % (taux typique, tranche de base ; 24 % au-delà) "
            "sur la plus-value nette au-delà de 3 000 £ par année fiscale "
            "(du 6 avril au 5 avril). Coût moyen (pool)."
        ),
        notes=(
            "Les règles du même jour et des 30 jours ne sont pas simulées.",
            "La livre n'est pas proposée : l'abattement est converti au taux du jour.",
        ),
        sources=(
            Source("GOV.UK – Capital Gains Tax rates and allowances", "https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances"),
        ),
    ),
    "US": TaxRule(
        code="US",
        name="États-Unis",
        default_currency="usd",
        method="fifo",
        amounts_currency="usd",
        short_term_rate=D("0.22"),
        long_term_rate=D("0.15"),
        summary=(
            "Gains détenus un an ou moins : taux de l'impôt sur le revenu (22 % retenu "
            "comme taux typique). Plus d'un an : 15 % (taux typique). Coût des ventes en FIFO."
        ),
        notes=("Les impôts des États et la NIIT ne sont pas simulés.",),
        sources=(
            Source("IRS – Topic 409, Capital gains and losses", "https://www.irs.gov/taxtopics/tc409"),
            Source("IRS – Digital assets", "https://www.irs.gov/filing/digital-assets"),
        ),
    ),
}

SUPPORTED_COUNTRIES = tuple(TAX_RULES)


def get_rule(code: str) -> TaxRule:
    return TAX_RULES[code]
