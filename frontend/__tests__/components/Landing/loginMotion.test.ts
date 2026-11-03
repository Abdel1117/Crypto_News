import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  animate: vi.fn(),
  set: vi.fn(),
  add: vi.fn(),
  splitText: vi.fn(),
}));

vi.mock("animejs", () => ({
  animate: mocks.animate,
  utils: { set: mocks.set },
  stagger: (value: number) => value,
  createTimeline: () => ({ add: mocks.add }),
  splitText: mocks.splitText,
  svg: { createDrawable: (elements: unknown) => elements },
}));

import {
  loginFormIntro,
  loginShowcaseIntro,
  slideLoginForm,
} from "@/app/components/Landing/motion/landingMotion";

// jsdom has no layout: each item's position is scripted here. A transform left
// on an item (a slide still running) adds to it, as it would in a browser.
const layout = new Map<HTMLElement, number>();
const RUNNING_SLIDE = 30;

function addItem(root: HTMLElement, top: number) {
  const el = document.createElement("div");
  el.dataset.anim = "login-item";
  el.getBoundingClientRect = () =>
    ({
      top: (layout.get(el) ?? 0) + (el.style.transform ? RUNNING_SLIDE : 0),
    }) as DOMRect;
  layout.set(el, top);
  root.append(el);
  return el;
}

const reduceMotion = (matches: boolean) =>
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches })));

describe("slideLoginForm", () => {
  let root: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    layout.clear();
    root = document.createElement("main");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("slides an item from its old position to its new one", () => {
    const el = addItem(root, 100);

    slideLoginForm(root, () => layout.set(el, 25));

    expect(mocks.set).toHaveBeenCalledWith(el, { y: 75 });
    expect(mocks.animate).toHaveBeenCalledTimes(1);
    expect(mocks.animate).toHaveBeenCalledWith(
      [el],
      expect.objectContaining({ y: 0 }),
    );
  });

  it("leaves items that did not move alone", () => {
    addItem(root, 100);

    slideLoginForm(root, () => {});

    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("fades in items the update added", () => {
    let added: HTMLElement | undefined;

    slideLoginForm(root, () => {
      added = addItem(root, 50);
    });

    expect(mocks.set).toHaveBeenCalledWith([added], { opacity: 0, y: 8 });
    expect(mocks.animate).toHaveBeenCalledWith(
      [added],
      expect.objectContaining({ opacity: 1, y: 0 }),
    );
  });

  it("ignores items the update removed", () => {
    const el = addItem(root, 100);

    slideLoginForm(root, () => el.remove());

    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("starts from where a running slide had got to, not its end point", () => {
    const el = addItem(root, 100);
    el.style.transform = "translateY(30px)";

    // Back to the same layout position, but on screen it's still 30px away.
    slideLoginForm(root, () => {});

    expect(mocks.set).toHaveBeenCalledWith(el, { y: RUNNING_SLIDE });
  });

  it("only applies the update under reduced motion", () => {
    reduceMotion(true);
    const el = addItem(root, 100);
    const update = vi.fn(() => layout.set(el, 25));

    slideLoginForm(root, update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.animate).not.toHaveBeenCalled();
  });

  it("still applies the update without a root", () => {
    const update = vi.fn();

    slideLoginForm(null, update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(mocks.animate).not.toHaveBeenCalled();
  });
});

describe("loginFormIntro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides the items, then brings them in one after another", () => {
    const root = document.createElement("main");
    const first = addItem(root, 0);
    const second = addItem(root, 10);

    loginFormIntro(root);

    expect(mocks.set).toHaveBeenCalledWith([first, second], {
      opacity: 0,
      y: 12,
    });
    expect(mocks.animate).toHaveBeenCalledWith(
      [first, second],
      expect.objectContaining({ opacity: 1, y: 0 }),
    );
  });
});

describe("loginShowcaseIntro", () => {
  const buildPanel = (visible: boolean) => {
    const root = document.createElement("aside");
    root.innerHTML = `
      <h2 data-anim="headline">Titre</h2>
      <div data-anim="card"><div data-anim="row"></div></div>
      <ul><li data-anim="perk"></li></ul>`;
    root.getClientRects = () =>
      (visible ? [{}] : []) as unknown as DOMRectList;
    return root;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.splitText.mockReturnValue({ words: [document.createElement("span")] });
  });

  it("plays nothing while the panel is hidden on small screens", () => {
    loginShowcaseIntro(buildPanel(false));

    expect(mocks.splitText).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("animates each part of the panel when it is visible", () => {
    const root = buildPanel(true);

    loginShowcaseIntro(root);

    expect(mocks.splitText).toHaveBeenCalledWith(
      root.querySelector("h2"),
      { words: true },
    );
    // Words, card, row and perk: no sparkline in this panel.
    expect(mocks.add).toHaveBeenCalledTimes(4);
  });
});
