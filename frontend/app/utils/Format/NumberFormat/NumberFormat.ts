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
    const number = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(number)) return '';

    // Remove decimals and format with spaces as thousand separators
    return Math.floor(number)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}