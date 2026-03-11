export async function fetchPrices(currency: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BACK_END}/markets?currency=${encodeURIComponent(currency)}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch prices");
  }

  return res.json();
}