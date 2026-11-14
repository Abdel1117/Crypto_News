import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { useState } from "react";

vi.mock("@/app/lib/api/crypto", () => ({
  searchSymbols: vi.fn(),
  fetchMarketCoin: vi.fn(),
}));

import { fetchMarketCoin, searchSymbols } from "@/app/lib/api/crypto";
import ProTradeForm, { type CoinChoice } from "@/app/components/SimulationPro/ProTradeForm";
import { jsonResponse, makePortfolio, makeProStore, makeTrade } from "../../lib/simulationProTestUtils";

const SOLANA: CoinChoice = { id: "solana", symbol: "sol", name: "Solana", image: "" };

function Harness({ initial = null }: { initial?: CoinChoice | null }) {
  const [selected, setSelected] = useState<CoinChoice | null>(initial);
  return <ProTradeForm portfolio={makePortfolio()} selected={selected} onSelect={setSelected} />;
}

function renderForm(initial: CoinChoice | null = null) {
  const store = makeProStore({ status: "ready", portfolio: makePortfolio() });
  render(
    <Provider store={store}>
      <Harness initial={initial} />
    </Provider>,
  );
  return store;
}

function stubTradeApi() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") return jsonResponse(201, makeTrade());
    if (String(url).includes("/simulation/trades")) return jsonResponse(200, { items: [], total: 0 });
    return jsonResponse(200, makePortfolio());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const amountInput = () => screen.getByRole("textbox", { name: /Montant à investir|Quantité à vendre/ });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchMarketCoin).mockResolvedValue({ price: 100 });
  vi.mocked(searchSymbols).mockResolvedValue([SOLANA]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ProTradeForm — buy", () => {
  it("finds a coin by search and shows its price", async () => {
    renderForm();
    fireEvent.change(screen.getByRole("searchbox", { name: "Crypto" }), { target: { value: "sol" } });

    fireEvent.click(await screen.findByRole("button", { name: /Solana/ }));

    expect(await screen.findByText(/Prix actuel 100,00/)).toBeTruthy();
    expect(searchSymbols).toHaveBeenCalledWith("sol");
  });

  it("does not search for a single letter", async () => {
    vi.useFakeTimers();
    renderForm();
    fireEvent.change(screen.getByRole("searchbox", { name: "Crypto" }), { target: { value: "s" } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(searchSymbols).not.toHaveBeenCalled();
  });

  it("buys by amount, fee included, and shows the estimate", async () => {
    const fetchMock = stubTradeApi();
    renderForm(SOLANA);
    await screen.findByText(/Prix actuel/);

    fireEvent.change(amountInput(), { target: { value: "1001" } });
    // 1001 with 0.1 % fee: 1000 invested, 1 of fee, 10 SOL at 100.
    expect(screen.getByText(/^1,00\s€$/)).toBeTruthy();
    expect(screen.getByText(/10,000000 SOL/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Acheter du Solana" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ coin_id: "solana", side: "buy", amount: "1001" });
    await waitFor(() => expect((amountInput() as HTMLInputElement).value).toBe(""));
  });

  it("Max uses all the cash", async () => {
    renderForm(SOLANA);
    await screen.findByText(/Prix actuel/);
    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    expect((amountInput() as HTMLInputElement).value).toBe("7500");
  });

  it("explains why an order can't be sent", async () => {
    renderForm(SOLANA);
    await screen.findByText(/Prix actuel/);

    fireEvent.change(amountInput(), { target: { value: "9000" } });
    expect(screen.getByText("Montant supérieur à tes liquidités.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Acheter du Solana" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(amountInput(), { target: { value: "0,5" } });
    expect(screen.getByText(/Montant trop petit/)).toBeTruthy();
  });

  it("shows the server's refusal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { detail: "Solde insuffisant pour cet achat." })),
    );
    renderForm(SOLANA);
    await screen.findByText(/Prix actuel/);
    fireEvent.change(amountInput(), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Acheter du Solana" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Solde insuffisant pour cet achat.");
  });

  it("says when the price is unavailable", async () => {
    vi.mocked(fetchMarketCoin).mockRejectedValue(new Error("down"));
    renderForm(SOLANA);
    expect(await screen.findByText(/Prix indisponible/)).toBeTruthy();
  });
});

describe("ProTradeForm — sell", () => {
  const sellTab = () => fireEvent.click(screen.getByRole("button", { name: "Vendre" }));

  it("lists the positions and sells the exact held quantity with Max", async () => {
    const fetchMock = stubTradeApi();
    renderForm();
    sellTab();
    fireEvent.change(screen.getByRole("combobox", { name: "Position" }), { target: { value: "bitcoin" } });
    await screen.findByText(/détenu 0,040000 BTC/);

    fireEvent.click(screen.getByRole("button", { name: "Max" }));
    fireEvent.click(screen.getByRole("button", { name: "Vendre du Bitcoin" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ coin_id: "bitcoin", side: "sell", quantity: "0.04" });
  });

  it("refuses to sell more than held", async () => {
    renderForm();
    sellTab();
    fireEvent.change(screen.getByRole("combobox", { name: "Position" }), { target: { value: "bitcoin" } });
    await screen.findByText(/détenu/);
    fireEvent.change(amountInput(), { target: { value: "1" } });
    expect(screen.getByText("Quantité supérieure à ta position.")).toBeTruthy();
  });

  it("drops a selected coin that isn't held", () => {
    renderForm(SOLANA);
    sellTab();
    expect((screen.getByRole("combobox", { name: "Position" }) as HTMLSelectElement).value).toBe("");
  });
});
