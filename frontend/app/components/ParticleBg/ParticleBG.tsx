"use client";
import { useMemo } from "react";
import {
  Particles,
  ParticlesProvider,
  useParticlesProvider,
} from "@tsparticles/react";
import { type Engine, type ISourceOptions, OutMode } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "@/app/context/Theme/ThemeContext";

const initEngine = async (engine: Engine) => {
  await loadSlim(engine);
};

function ParticlesInner() {
  const { loaded } = useParticlesProvider();
  const { theme } = useTheme();

  const options: ISourceOptions = useMemo(
    () => ({
      background: { color: { value: "" } },
      fpsLimit: 60,
      interactivity: {
        events: { onHover: { enable: true, mode: "repulse" } },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 200, duration: 0.4 },
        },
      },
      particles: {
        color: { value: theme === "light" ? "#07101E" : "#f0f0f0" },
        move: {
          direction: "right",
          enable: true,
          outModes: { default: OutMode.out },
          random: false,
          speed: 1,
          straight: true,
        },
        number: { density: { enable: true }, value: 80 },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 5 } },
      },
      detectRetina: true,
    }),
    [theme],
  );

  if (!loaded) return <></>;
  return <Particles id="tsparticles" options={options} />;
}

export const ParticlesBg = () => (
  <ParticlesProvider init={initEngine}>
    <ParticlesInner />
  </ParticlesProvider>
);
