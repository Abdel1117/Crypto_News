import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import ChatWidget from "@/app/components/ChatWidget/ChatWidget";
import ChatMarkdown from "@/app/components/ChatWidget/ChatMarkdown";
import { AVAILABILITY_NOTICES, SUGGESTIONS } from "@/app/components/ChatWidget/ChatPanel";
import { jsonResponse, makeChatStore, sse, sseResponse } from "../../lib/chatTestUtils";

vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderWidget(options: Parameters<typeof makeChatStore>[0] = {}) {
  const store = makeChatStore(options);
  render(
    <Provider store={store}>
      <ChatWidget />
    </Provider>,
  );
  return store;
}

function stubChatApi(answer: string) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) =>
    url.endsWith("/chat/usage")
      ? jsonResponse(200, { used: 0, limit: 30, remaining: 30, available: true })
      : sseResponse([
          sse({ type: "usage", used: 1, limit: 30, remaining: 29 }),
          sse({ type: "text", text: answer }),
          sse({ type: "done" }),
        ]),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const openButton = () => screen.getByRole("button", { name: "Ouvrir l'assistant marché" });

describe("ChatWidget", () => {
  it("shows only the floating button when closed", () => {
    renderWidget();
    expect(openButton()).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("invites logged-out visitors to log in", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWidget({ loggedIn: false });
    fireEvent.click(openButton());

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows suggestions and the remaining messages when logged in", async () => {
    stubChatApi("ok");
    renderWidget();
    fireEvent.click(openButton());

    for (const s of SUGGESTIONS) {
      expect(screen.getByRole("button", { name: s })).toBeTruthy();
    }
    expect(await screen.findByText(/30 messages restants/)).toBeTruthy();
  });

  it("sends a suggestion and shows the streamed answer", async () => {
    const fetchMock = stubChatApi("Le marché est **calme**.");
    renderWidget();
    fireEvent.click(openButton());
    fireEvent.click(screen.getByRole("button", { name: SUGGESTIONS[1] }));

    expect(await screen.findByText("calme")).toBeTruthy();
    expect(screen.getByText(SUGGESTIONS[1])).toBeTruthy();
    expect(await screen.findByText(/29 messages restants/)).toBeTruthy();

    const chatCall = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/chat"))!;
    const body = JSON.parse(chatCall[1]!.body as string);
    expect(body.currency).toBe("eur");
    expect(body.messages.at(-1)).toEqual({ role: "user", content: SUGGESTIONS[1] });
  });

  it("sends the typed question with Enter", async () => {
    stubChatApi("Réponse");
    renderWidget();
    fireEvent.click(openButton());

    const input = screen.getByRole("textbox", { name: "Ta question" });
    fireEvent.change(input, { target: { value: "Prix de l'ETH ?" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Réponse")).toBeTruthy();
    expect((input as HTMLTextAreaElement).value).toBe("");
  });

  it("disables the input once the daily limit is reached", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWidget({ chat: { usage: { used: 30, limit: 30, remaining: 0 } } });
    fireEvent.click(openButton());

    const input = screen.getByRole("textbox", { name: "Ta question" }) as HTMLTextAreaElement;
    expect(input.disabled).toBe(true);
    expect(input.placeholder).toMatch(/Limite du jour/);
  });

  it("shows a notice and blocks sending when the assistant is not configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { used: 0, limit: 30, remaining: 30, available: false }),
      ),
    );
    renderWidget();
    fireEvent.click(openButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(AVAILABILITY_NOTICES.unavailable);
    const input = screen.getByRole("textbox", { name: "Ta question" }) as HTMLTextAreaElement;
    expect(input.disabled).toBe(true);
    expect((screen.getByRole("button", { name: SUGGESTIONS[0] }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("shows a notice when the server cannot be reached, and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(jsonResponse(200, { used: 0, limit: 30, remaining: 30, available: true }));
    vi.stubGlobal("fetch", fetchMock);
    renderWidget();
    fireEvent.click(openButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(AVAILABILITY_NOTICES.unreachable);

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(
      (screen.getByRole("textbox", { name: "Ta question" }) as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });

  it("closes with Escape and keeps the conversation", async () => {
    stubChatApi("ok");
    const store = renderWidget({
      chat: { messages: [{ id: "1", role: "user", content: "Bonjour" }] },
    });
    fireEvent.click(openButton());
    expect(screen.getByText("Bonjour")).toBeTruthy();

    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(store.getState().chat.messages).toHaveLength(1);
  });

  it("starts a new conversation", () => {
    stubChatApi("ok");
    const store = renderWidget({
      chat: {
        messages: [
          { id: "1", role: "user", content: "Bonjour" },
          { id: "2", role: "assistant", content: "Salut" },
        ],
      },
    });
    fireEvent.click(openButton());
    fireEvent.click(screen.getByRole("button", { name: "Nouvelle conversation" }));

    expect(store.getState().chat.messages).toEqual([]);
  });
});

describe("ChatMarkdown", () => {
  it("renders lists, bold text and paragraphs", () => {
    const { container } = render(
      <ChatMarkdown text={"## Résumé\nLe **BTC** monte.\n\n- un\n- deux\n\n1. premier\n2. second"} />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("BTC");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
    expect(screen.getByText("Résumé")).toBeTruthy();
  });

  it("never renders model output as HTML", () => {
    const { container } = render(<ChatMarkdown text={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
