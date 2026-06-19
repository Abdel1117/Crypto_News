"use client";
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { type ISourceOptions, OutMode } from "@tsparticles/engine";

export const ParticlesBg = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particleColor = "#F9B707";

  const options: ISourceOptions = {
    fullScreen: { enable: true, zIndex: 1 },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: "repulse" } },
      modes: {
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: particleColor },
      move: {
        enable: true,
        speed: 1,
        direction: "right",
        straight: false,
        outModes: { default: OutMode.out },
      },
      number: { value: 200, density: { enable: true } },
      opacity: { value: 0.8 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 5 } },
    },
    detectRetina: true,
  };

  if (!init) return <></>;
  return <Particles key={particleColor} id="tsparticles" options={options} />;
};
