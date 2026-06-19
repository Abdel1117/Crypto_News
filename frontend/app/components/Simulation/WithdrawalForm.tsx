"use client";

import React, { useState } from "react";

const COUNTRY_FEES = {
  France: 0.015, // 1.5%
  Maroc: 0.02, // 2%
  USA: 0.01, // 1%
  Autre: 0.025, // 2.5%
};

const countryList = Object.keys(COUNTRY_FEES);

export default function WithdrawalForm() {
  const [country, setCountry] = useState("France");
  const [amount, setAmount] = useState("");

  // Les frais sont calculés uniquement sur le montant retiré, indépendamment du bénéfice utilisateur
  const feeRate = COUNTRY_FEES[country as keyof typeof COUNTRY_FEES] || COUNTRY_FEES["Autre"];
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * feeRate;
  const total = numAmount - fee;

  return (
    <form className="bg-card rounded-lg p-4 space-y-4 mt-4">
      <h3 className="text-lg font-semibold text-foreground">Retrait</h3>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Pays</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring focus:border-primary"
        >
          {countryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">
          Montant à retirer
        </label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring focus:border-primary"
        />
      </div>
      {numAmount > 0 && (
        <div className="text-sm bg-surface rounded-lg px-3 py-2 mt-2">
          <div>
            Frais de retrait ({(feeRate * 100).toFixed(1)}%) :{" "}
            <span className="font-semibold">{fee.toFixed(2)}</span>
          </div>
          <div>
            Montant reçu :{" "}
            <span className="font-semibold">{total.toFixed(2)}</span>
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={numAmount <= 0}
        className={`w-full py-2.5 rounded-lg font-semibold transition-colors hover:cursor-pointer ${
          numAmount > 0
            ? "bg-primary text-white"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        Retirer
      </button>
    </form>
  );
}
