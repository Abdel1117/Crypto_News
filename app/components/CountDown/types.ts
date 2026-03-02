import type { ReactNode } from "react";

export type CountDownUnit = "days" | "hours" | "minutes" | "seconds";

export type Labels = Partial<Record<CountDownUnit, string>>;

export type CountDownParts = Record<CountDownUnit, number>;

export type CountDownProps = {
  /** Date cible (Date, timestamp en ms, ou string parseable par Date) */
  target: Date | number | string;

  /** Appelé une seule fois quand le compte à rebours atteint 0 */
  onComplete?: () => void;

  /** Unités affichées (ordre respecté) */
  units?: CountDownUnit[];

  /** Libellés sous les valeurs */
  labels?: Labels;

  /** Afficher des séparateurs entre les unités */
  showSeparators?: boolean;

  /** Séparateur custom (ex: ":"), sinon un ":" par défaut */
  separator?: ReactNode;

  /** Si true, stoppe à 0; sinon peut afficher du négatif (par défaut: true) */
  clampToZero?: boolean;

  /** Classes Tailwind optionnelles */
  className?: string;
  unitClassName?: string;
  valueClassName?: string;
  labelClassName?: string;

  /**
   * Injection pour tests / DIP: permet de contrôler le temps.
   * Par défaut: Date.now
   */
  nowProvider?: () => number;
};
