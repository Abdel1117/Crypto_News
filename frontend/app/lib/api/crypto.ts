
/* Function to call for the market base */
export async function fetchPrices(currency: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BACK_END}/markets?currency=${encodeURIComponent(currency)}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch prices");
  }

  return res.json();
}


/* Function to call for the symbole base */

export async function fetchSymbols(currency : string ) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BACK_END}/symbols?currency=${encodeURIComponent(currency)}`);

  if(!res.ok){
    throw new Error("Failed to fetch Symbols")
  }
  return res.json()
}