"use client";

import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import CryptoInfoCard from "@/app/ui/CryptoInfoCard/CryptoInfoCard";
import CandleStickGraph from "@/app/components/CandleStickGraph/CandleStickGraph";
import Loading from "./loading";
import { send } from "@/app/lib/ws/socket";
import { useEffect } from "react";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useDispatch } from "react-redux";
import { getSymbols } from "@/app/lib/features/symbol/symbolThunks";

export default function DashboardPage() {
  const { currency } = useCurrency();
  const dispatch = useAppDispatch();
  const { coins, loading } = useAppSelector((state) => state.prices);

  const preferedNumberOfCrypto = 6;

  useEffect(() => {
    send({ currency });
  }, [currency]);

  useEffect(() => {
    dispatch(getSymbols(currency));
  }, [dispatch, currency]);

  const topCrypto = Array.isArray(coins)
    ? coins.slice(0, preferedNumberOfCrypto)
    : [];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: preferedNumberOfCrypto }).map((_, i) => (
              <Loading key={i} />
            ))
          : topCrypto.map((coin) => (
              <CryptoInfoCard key={coin.id} coin={coin} />
            ))}
      </div>

      <CandleStickGraph />
    </section>
  );
}
