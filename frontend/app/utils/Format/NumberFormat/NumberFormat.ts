/**
 * Formats a number or numeric string as a currency-like string with spaces as thousand separators and no decimals.
 *
 * Example:
 *   formatNumberToCurrency(1234567.89) // "1 234 567"
 *   formatNumberToCurrency("9876543.21") // "9 876 543"
 *
 * @param {number | string} value - The number or string to format. Can be a number or a string representing a number.
 * @returns {string} The formatted string with spaces as thousand separators, or an empty string if input is invalid.
 */
export function formatNumberToCurrency(value: number | string): string {
    const number = typeof value === 'string' ? Number.parseFloat(value) : value;
    if (Number.isNaN(number)) return '';

    // Remove decimals, then format with spaces as thousand separators by
    // grouping digits from the right (reverse, group, reverse back) instead
    // of a lookahead-based regex, which avoids super-linear backtracking.
    const floored = Math.floor(number);
    const sign = floored < 0 ? '-' : '';
    const digits = Math.abs(floored).toString();

    const grouped = digits
        .split('')
        .reverse()
        .join('')
        .replace(/\d{3}(?=\d)/g, '$& ')
        .split('')
        .reverse()
        .join('');

    return sign + grouped;
}