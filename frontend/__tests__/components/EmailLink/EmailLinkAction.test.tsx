import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.value,
}));

import EmailLinkAction from "@/app/components/EmailLink/EmailLinkAction";
import { jsonResponse } from "../../lib/simulationProTestUtils";
import ConfirmEmailPage, {
  metadata as confirmMetadata,
} from "@/app/(public)/confirmer-email/page";
import UnsubscribePage, {
  metadata as unsubscribeMetadata,
} from "@/app/(public)/desabonnement/page";

function renderAction() {
  render(
    <EmailLinkAction
      path="/some/route"
      title="Titre"
      intro="Intro"
      actionLabel="Agir"
      successTitle="C’est fait"
      successText="Bravo"
    />,
  );
}

beforeEach(() => {
  searchParams.value = new URLSearchParams("token=abc.def");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EmailLinkAction", () => {
  it("does nothing until the button is clicked, so mail scanners can't trigger it", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderAction();
    expect(screen.getByRole("heading", { name: "Titre" })).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the link's token on click, then confirms", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    renderAction();

    fireEvent.click(screen.getByRole("button", { name: "Agir" }));

    expect(await screen.findByRole("heading", { name: "C’est fait" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voir mes alertes" }).getAttribute("href")).toBe("/alertes");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/some\/route$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ token: "abc.def" });
  });

  it("shows the server's refusal and lets the user retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(400, { detail: "Lien invalide ou expiré." })));
    renderAction();

    fireEvent.click(screen.getByRole("button", { name: "Agir" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Lien invalide ou expiré.");
    expect((screen.getByRole("button", { name: "Agir" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("says when the link has no token", () => {
    searchParams.value = new URLSearchParams();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderAction();

    expect(screen.getByRole("alert").textContent).toBe("Lien invalide ou expiré.");
    expect((screen.getByRole("button", { name: "Agir" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("the pages behind the emailed links", () => {
  it("aren't indexed", () => {
    expect(confirmMetadata.robots).toEqual({ index: false, follow: false });
    expect(unsubscribeMetadata.robots).toEqual({ index: false, follow: false });
  });

  it("confirm the address through the right route", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    render(<ConfirmEmailPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmer mon adresse" }));
    await screen.findByRole("heading", { name: "Adresse confirmée" });
    expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toMatch(
      /\/auth\/email-verification\/confirm$/,
    );
  });

  it("turn the alerts off through the right route", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { deactivated: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<UnsubscribePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Désactiver toutes mes alertes" }));
    await screen.findByRole("heading", { name: "Alertes désactivées" });
    expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toMatch(/\/alerts\/unsubscribe$/);
  });
});
