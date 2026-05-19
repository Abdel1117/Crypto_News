import { formatPrice } from "@/app/utils/Format/PriceFormat/PriceFormat";
import React from "react";

interface InfoCardProps {
  value: number;
  symbol: string;
  label?: string;
  loading?: boolean;
}

export default function InfoCard({
  value,
  symbol,
  label = "Solde disponible",
  loading = false,
}: InfoCardProps) {
  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">
        {loading ? (
          <span className="animate-pulse">Chargement...</span>
        ) : (
          formatPrice(value, 2, symbol)
        )}
      </p>
    </div>
  );
}
