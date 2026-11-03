import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { scope, createScope } = vi.hoisted(() => {
  const scope = {
    add: vi.fn((fn: () => void) => {
      fn();
      return scope;
    }),
    revert: vi.fn(),
  };
  return { scope, createScope: vi.fn(() => scope) };
});

vi.mock("animejs", () => ({ createScope }));

import {
  useLandingMotion,
  type MotionSetup,
} from "@/app/components/Landing/motion/useLandingMotion";

// `hidden` stands in for the pre-hydration CSS, which jsdom doesn't load.
function Section({ setup, hidden = true }: { setup: MotionSetup; hidden?: boolean }) {
  const ref = useLandingMotion<HTMLElement>(setup);
  return (
    <section ref={ref} data-testid="root" data-motion-root="">
      <p data-motion-hide="" style={hidden ? { opacity: 0 } : undefined}>
        Contenu
      </p>
    </section>
  );
}

const reduceMotion = (matches: boolean) =>
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches })));

describe("useLandingMotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs the setup in an anime.js scope and marks the root ready", () => {
    const setup = vi.fn();
    render(<Section setup={setup} />);

    const root = screen.getByTestId("root");
    expect(createScope).toHaveBeenCalledWith({ root });
    expect(setup).toHaveBeenCalledWith(root);
    expect(root.hasAttribute("data-motion-ready")).toBe(true);
  });

  it("skips the animation under reduced motion but still reveals", () => {
    reduceMotion(true);
    const setup = vi.fn();
    render(<Section setup={setup} />);

    expect(setup).not.toHaveBeenCalled();
    expect(createScope).not.toHaveBeenCalled();
    expect(screen.getByTestId("root").hasAttribute("data-motion-ready")).toBe(true);
  });

  it("skips the animation when the content is already visible", () => {
    reduceMotion(false);
    const setup = vi.fn();
    render(<Section setup={setup} hidden={false} />);

    expect(setup).not.toHaveBeenCalled();
    expect(screen.getByTestId("root").hasAttribute("data-motion-ready")).toBe(true);
  });

  it("reverts the scope and the ready flag on unmount", () => {
    const { unmount } = render(<Section setup={vi.fn()} />);
    const root = screen.getByTestId("root");

    unmount();

    expect(scope.revert).toHaveBeenCalledTimes(1);
    expect(root.hasAttribute("data-motion-ready")).toBe(false);
  });

  it("reverts and logs instead of crashing when the setup throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const setup = vi.fn(() => {
      throw new Error("boom");
    });

    render(<Section setup={setup} />);

    expect(scope.revert).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Landing animation failed", expect.any(Error));
    expect(screen.getByText("Contenu")).toBeTruthy();
    error.mockRestore();
  });
});
