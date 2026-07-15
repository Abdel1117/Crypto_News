

/**
 * @description Function to format price in eur or usd 
 * @example formatPrice(12030.59395, 2, eur)
 * @param {Number} price:number
 * @param {String} currency:string
 * @param {Number} toFixed:number=2
 * @returns {string}
 */
export function formatPrice(price: number,currency: string,  toFixed: number = 2, ) {
  const [int, dec] = price.toFixed(toFixed).split(".");
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted},${dec}${currency}`;
}
