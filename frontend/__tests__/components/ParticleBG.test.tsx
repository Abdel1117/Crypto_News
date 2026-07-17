import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

vi.mock("@tsparticles/react", () => ({
  default: ({ id }: { id: string }) => <div data-testid="particles" data-id={id} />,
  initParticlesEngine: vi.fn((cb: (engine: unknown) => Promise<void>) => cb({}).then(() => undefined)),
}));
vi.mock("@tsparticles/slim", () => ({ loadSlim: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@tsparticles/engine", () => ({ OutMode: { out: "out" } }));

import { ParticlesBg } from "../../app/components/ParticleBg/ParticleBG";

describe("ParticlesBg", () => {
  it("renders nothing until the particles engine is initialized, then renders", async () => {
    const { container, findByTestId } = render(<ParticlesBg />);
    expect(container.querySelector('[data-testid="particles"]')).toBeNull();

    const particles = await findByTestId("particles");
    expect(particles.getAttribute("data-id")).toBe("tsparticles");
  });
});
