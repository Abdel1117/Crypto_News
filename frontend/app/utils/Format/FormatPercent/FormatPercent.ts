/**
 * Retourne une couleur CSS en fonction du signe du pourcentage.
 * Par défaut : vert pour positif, rouge pour négatif, gris pour zéro ou NaN.
 *
 * @param {number} value - La valeur à tester (ex: 0.1234 pour 12.34%).
 * @param {string} [positiveColor='#16a34a'] - Couleur pour les valeurs positives.
 * @param {string} [negativeColor='#dc2626'] - Couleur pour les valeurs négatives.
 * @param {string} [neutralColor='#64748b'] - Couleur pour zéro ou NaN.
 * @returns {string} La couleur CSS correspondante.
 * @example
 *   getPercentColor(0.1)   // '#16a34a'
 *   getPercentColor(-0.2)  // '#dc2626'
 *   getPercentColor(0)     // '#64748b'
 */
export function getPercentColor(
  value: number,
  positiveColor: string = 'text-success',
  negativeColor: string = 'text-red-500',
  neutralColor: string = 'text-neutral-500'
): string {
  if (Number.isNaN(value) || value === 0) return neutralColor;
  if (value > 0) return positiveColor;
  return negativeColor;
}

/**
 * Formats a number as a percentage string with sign and fixed decimals.
 * If the value is positive, a "+" is prepended; if negative, the sign is kept; if zero, returns "0.00%".
 *
 * @param {number} value - The value already in percent (e.g., 56.44 for 56.44%).
 * @param {number} [decimals=2] - Number of decimal places to display.
 * @returns {string} The formatted percentage string with sign.
 * @example
 *   formatPercentValue(56.44)   // '+56.44%'
 *   formatPercentValue(-2.5)    // '-2.50%'
 *   formatPercentValue(0)       // '0.00%'
 */
export function formatPercentValue(
  value: number,
  decimals: number = 2
): string {
  if (Number.isNaN(value)) return "";
  if (value > 0) return `+${value.toFixed(decimals)}%`;
  if (value < 0) return `${value.toFixed(decimals)}%`;
  return `0.00%`;
}
