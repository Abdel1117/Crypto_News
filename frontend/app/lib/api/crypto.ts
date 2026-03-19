import { MarketViewState } from "../features/marketView/marketViewSlice";

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




export async function callOhlc(currency :string , selectedTimeFrame : MarketViewState["selectedTimeFrame"] , cryptoId : string ) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BACK_END}/symbols?currency=${encodeURIComponent(currency)}?selectedTimeFrame=${encodeURIComponent(selectedTimeFrame)}cryptoId=${encodeURIComponent(cryptoId)}`);
  if(!res.ok){
    throw new Error("Failed to fetch Symbols")
  }
  return res.json()
}