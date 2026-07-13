"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { getSymbols } from "@/app/lib/features/symbol/symbolThunks";
import {
  readLocalSymbols,
  setSymbols as setSymbolsAction,
} from "@/app/lib/features/symbol/symbolSlice";

// Loads the shared "symbols" state once for every route under the (app) group,
// so it survives a hard refresh regardless of which page is the entry point.
export default function SymbolsBootstrap() {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();

  useEffect(() => {
    const persisted = readLocalSymbols();
    if (persisted && persisted.length > 0) {
      dispatch(setSymbolsAction(persisted));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(getSymbols(currency));
  }, [dispatch, currency]);

  return null;
}
