

/**
 * @description Function to format price in eur or usd 
 * @example formatPrice(12030.59395, 2, eur)
 * @param {Number} price:number
 * @param {Number} toFixed:number=2
 * @param {String} currency:string
 * @returns {string}
 */
export function formatPrice(price: number, toFixed: number = 2, currency: string) {
  const [int, dec] = price.toFixed(toFixed).split(".");
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted},${dec}${currency}`;
}
