import React from "react";
interface CryptoInfoCardProps {
  cryptoIcon: SVGElement;
  cyrptoName: string;
  currency: string[];
}
export default function CryptoInfoCard({}) {
  return (
    <div className="bg-surface p-2.5">
      <div className="flex items-center justify-between">
        <Icon />
      </div>
    </div>
  );
}
