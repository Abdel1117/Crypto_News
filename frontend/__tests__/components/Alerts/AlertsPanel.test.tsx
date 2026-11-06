import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";

vi.mock("@/app/lib/api/crypto", () => ({
  searchSymbols: vi.fn(),
  fetchMarketCoin: vi.fn(),
}));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

import { fetchMarketCoin, searchSymbols } from "@/app/lib/api/crypto";
import AlertsPanel from "@/app/components/Alerts/AlertsPanel";
import type { AlertsOverview, PriceAlert } from "@/app/lib/api/alerts";
import { jsonResponse, makeProStore } from "../../lib/simulationProTestUtils";

const BITCOIN = { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "" };

function makeAlert(overrides: Partial<PriceAlert> = {}): PriceAlert {
  return {
    id: 1,
    coin_id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    image: "",
    currency: "eur",
    direction: "below",
    threshold: 50000,
    is_active: true,
    created_at: "2026-11-06T10:00:00Z",
    triggered_at: null,
    triggered_price: null,
    ...overrides,
  };
}

function makeOverview(overrides: Partial<AlertsOverview> = {}): AlertsOverview {
  return {
    items: [],
    email: "t@example.com",
    email_verified: true,
    alerts_available: true,
    max_alerts: 20,
    check_interval_seconds: 600,
    ...overrides,
  };
}

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

/** Answers the overview, and lets a test answer anything else. */
function stubApi(overview: AlertsOverview | (() => AlertsOverview), handler?: Handler) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "GET" && String(url).endsWith("/alerts")) {
      return jsonResponse(200, typeof overview === "function" ? overview() : overview);
    }
    if (handler) return handler(String(url), init);
    throw new Error(`Unexpected call: ${method} ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function callsTo(fetchMock: ReturnType<typeof stubApi>, method: string) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === method);
}

function renderPanel() {
  render(
    <Provider store={makeProStore()}>
      <AlertsPanel />
    </Provider>,
  );
}

async function chooseBitcoin() {
  fireEvent.change(await screen.findByRole("searchbox", { name: "Crypto" }), {
    target: { value: "btc" },
  });
  fireEvent.click(await screen.findByRole("button", { name: /Bitcoin/ }));
  await screen.findByText(/Prix actuel/);
}

const thresholdInput = () => screen.getByRole("textbox", { name: /Seuil/ });
const submitButton = () => screen.getByRole("button", { name: /Créer l’alerte|Création/ });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchMarketCoin).mockResolvedValue({ price: 60000 });
  vi.mocked(searchSymbols).mockResolvedValue([BITCOIN]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AlertsPanel — loading", () => {
  it("shows a placeholder, then the page", async () => {
    stubApi(makeOverview());
    renderPanel();
    expect(screen.getByLabelText("Chargement")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Mes alertes" })).toBeTruthy();
  });

  it("offers to retry when loading fails", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(500, { detail: "Serveur indisponible" }));
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    expect((await screen.findByRole("alert")).textContent).toBe("Serveur indisponible");

    stubApi(makeOverview());
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByRole("heading", { name: "Mes alertes" })).toBeTruthy();
  });

  it("gives an example when there is no alert yet", async () => {
    stubApi(makeOverview());
    renderPanel();
    expect(await screen.findByText(/Aucune alerte pour le moment/)).toBeTruthy();
  });

  it("states how often prices are checked", async () => {
    stubApi(makeOverview({ check_interval_seconds: 300 }));
    renderPanel();
    expect(await screen.findByText(/vérifiés toutes les 5 minutes/)).toBeTruthy();
  });
});

describe("AlertsPanel — unconfirmed address", () => {
  const unconfirmed = () => makeOverview({ email_verified: false, email: "new@example.com" });

  it("asks to confirm the address instead of showing the form", async () => {
    stubApi(unconfirmed());
    renderPanel();
    expect(await screen.findByText("new@example.com")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Créer l’alerte/ })).toBeNull();
  });

  it("sends the link on request and says so", async () => {
    const fetchMock = stubApi(unconfirmed(), () => jsonResponse(202, { email_verified: false }));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Envoyer le lien/ }));

    expect(await screen.findByText(/E-mail envoyé/)).toBeTruthy();
    const [url] = callsTo(fetchMock, "POST")[0];
    expect(String(url)).toContain("/auth/email-verification");
  });

  it("shows why the link couldn't be sent, and lets the user retry", async () => {
    stubApi(unconfirmed(), () => jsonResponse(429, { detail: "Un e-mail vient d'être envoyé." }));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Envoyer le lien/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("Un e-mail vient d'être envoyé.");
    expect(screen.getByRole("button", { name: /Envoyer le lien/ })).toBeTruthy();
  });

  it("shows the form when the user comes back after confirming", async () => {
    let verified = false;
    stubApi(() => makeOverview({ email_verified: verified }));
    renderPanel();
    await screen.findByRole("button", { name: /Envoyer le lien/ });
    await act(async () => {}); // the focus listener is attached in an effect

    verified = true;
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByRole("button", { name: /Créer l’alerte/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Envoyer le lien/ })).toBeNull();
  });

  it("stops refreshing on focus once confirmed", async () => {
    const fetchMock = stubApi(makeOverview());
    renderPanel();
    await screen.findByRole("heading", { name: "Mes alertes" });
    await act(async () => {});
    const before = fetchMock.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(fetchMock.mock.calls.length).toBe(before);
  });

  it("still lets the user pause or delete, but not turn an alert on", async () => {
    stubApi(
      makeOverview({
        email_verified: false,
        items: [
          makeAlert({ id: 1 }),
          makeAlert({ id: 2, direction: "above", threshold: 85000, is_active: false }),
        ],
      }),
    );
    renderPanel();
    expect(await screen.findByRole("button", { name: /Mettre en pause/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Réactiver/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Supprimer/ })).toHaveLength(2);
  });
});

describe("AlertsPanel — service unavailable", () => {
  it("says so, hides the form and keeps the list", async () => {
    stubApi(makeOverview({ alerts_available: false, items: [makeAlert()] }));
    renderPanel();
    expect((await screen.findByRole("status")).textContent).toMatch(/pas disponibles/);
    expect(screen.queryByRole("button", { name: /Créer l’alerte/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Envoyer le lien/ })).toBeNull();
    expect(screen.getByText("Active")).toBeTruthy();
  });
});

describe("AlertsPanel — creating", () => {
  it("creates the alert and lists it", async () => {
    const fetchMock = stubApi(makeOverview(), () => jsonResponse(201, makeAlert()));
    renderPanel();
    await chooseBitcoin();

    fireEvent.change(thresholdInput(), { target: { value: "50 000,50" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText("Active")).toBeTruthy();
    const [url, init] = callsTo(fetchMock, "POST")[0];
    expect(String(url)).toMatch(/\/alerts$/);
    expect(JSON.parse(String(init?.body))).toEqual({
      coin_id: "bitcoin",
      currency: "eur",
      direction: "below",
      threshold: "50000.50",
    });
    expect((thresholdInput() as HTMLInputElement).value).toBe("");
  });

  it("sends the chosen direction and currency", async () => {
    const fetchMock = stubApi(makeOverview(), () =>
      jsonResponse(201, makeAlert({ direction: "above", currency: "usd", threshold: 85000 })),
    );
    renderPanel();
    await chooseBitcoin();

    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    fireEvent.click(screen.getByRole("button", { name: "Passe au-dessus" }));
    fireEvent.change(thresholdInput(), { target: { value: "85000" } });
    await waitFor(() => expect((submitButton() as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(submitButton());

    await screen.findByText("Active");
    const body = JSON.parse(String(callsTo(fetchMock, "POST")[0][1]?.body));
    expect(body).toMatchObject({ currency: "usd", direction: "above", threshold: "85000" });
  });

  it("quotes the price in the alert's currency", async () => {
    stubApi(makeOverview());
    renderPanel();
    await chooseBitcoin();
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    await waitFor(() => expect(fetchMarketCoin).toHaveBeenLastCalledWith("usd", "bitcoin"));
  });

  it("explains why the button is disabled", async () => {
    stubApi(makeOverview());
    renderPanel();
    expect(await screen.findByText("Cherche et choisis une crypto.")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);

    await chooseBitcoin();
    fireEvent.change(thresholdInput(), { target: { value: "70000" } });
    expect(screen.getByText("Le prix est déjà sous ce seuil.")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the server's refusal and keeps what was typed", async () => {
    stubApi(makeOverview(), () => jsonResponse(409, { detail: "Tu as déjà cette alerte." }));
    renderPanel();
    await chooseBitcoin();

    fireEvent.change(thresholdInput(), { target: { value: "50000" } });
    fireEvent.click(submitButton());

    expect((await screen.findByRole("alert")).textContent).toBe("Tu as déjà cette alerte.");
    expect((thresholdInput() as HTMLInputElement).value).toBe("50000");
  });

  it("can still try when the price can't be loaded", async () => {
    vi.mocked(fetchMarketCoin).mockRejectedValue(new Error("down"));
    stubApi(makeOverview(), () => jsonResponse(201, makeAlert()));
    renderPanel();
    fireEvent.change(await screen.findByRole("searchbox", { name: "Crypto" }), {
      target: { value: "btc" },
    });
    fireEvent.click(await screen.findByRole("button", { name: /Bitcoin/ }));

    expect(await screen.findByText("Prix actuel indisponible.")).toBeTruthy();
    fireEvent.change(thresholdInput(), { target: { value: "50000" } });
    expect((submitButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("stops at the limit", async () => {
    stubApi(makeOverview({ max_alerts: 1, items: [makeAlert()] }));
    renderPanel();
    expect(await screen.findByText(/Limite de 1 alertes atteinte/)).toBeTruthy();
    expect(screen.getByText("1 / 1")).toBeTruthy();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("AlertsPanel — the list", () => {
  it("describes each state", async () => {
    stubApi(
      makeOverview({
        items: [
          makeAlert({ id: 1 }),
          makeAlert({ id: 2, threshold: 40000, is_active: false }),
          makeAlert({
            id: 3,
            threshold: 45000,
            is_active: false,
            triggered_at: "2026-11-06T12:30:00Z",
            triggered_price: 44870.5,
          }),
        ],
      }),
    );
    renderPanel();

    expect(await screen.findByText("Active")).toBeTruthy();
    expect(screen.getByText("En pause")).toBeTruthy();
    const fired = screen.getByText(/^Déclenchée le/).textContent ?? "";
    expect(fired.replace(/[  ]/g, " ")).toContain("à 44 870,50 €");
  });

  it("pauses an active alert", async () => {
    const fetchMock = stubApi(makeOverview({ items: [makeAlert({ id: 9 })] }), () =>
      jsonResponse(200, makeAlert({ id: 9, is_active: false })),
    );
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Mettre en pause/ }));

    expect(await screen.findByText("En pause")).toBeTruthy();
    const [url, init] = callsTo(fetchMock, "PATCH")[0];
    expect(String(url)).toMatch(/\/alerts\/9$/);
    expect(JSON.parse(String(init?.body))).toEqual({ is_active: false });
  });

  it("turns an alert that fired back on", async () => {
    const fetchMock = stubApi(
      makeOverview({
        items: [makeAlert({ is_active: false, triggered_at: "2026-11-06T12:30:00Z" })],
      }),
      () => jsonResponse(200, makeAlert()),
    );
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Réactiver/ }));

    expect(await screen.findByText("Active")).toBeTruthy();
    expect(JSON.parse(String(callsTo(fetchMock, "PATCH")[0][1]?.body))).toEqual({ is_active: true });
  });

  it("shows why an alert can't be turned back on", async () => {
    stubApi(makeOverview({ items: [makeAlert({ is_active: false })] }), () =>
      jsonResponse(409, { detail: "BTC est déjà sous ce seuil." }),
    );
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Réactiver/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("BTC est déjà sous ce seuil.");
    expect((screen.getByRole("button", { name: /Réactiver/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("deletes an alert", async () => {
    const fetchMock = stubApi(makeOverview({ items: [makeAlert({ id: 9 })] }), () =>
      jsonResponse(204, null),
    );
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /Supprimer/ }));

    expect(await screen.findByText(/Aucune alerte pour le moment/)).toBeTruthy();
    expect(String(callsTo(fetchMock, "DELETE")[0][0])).toMatch(/\/alerts\/9$/);
  });

  it("names the alert in each button, for screen readers", async () => {
    stubApi(makeOverview({ items: [makeAlert()] }));
    renderPanel();
    const list = await screen.findByRole("list");
    const button = within(list).getByRole("button", { name: /Supprimer/ });
    expect(button.getAttribute("aria-label")).toMatch(/Supprimer l’alerte BTC Sous/);
  });
});
