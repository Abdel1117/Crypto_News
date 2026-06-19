import React from "react";

const frontendStack = [
  { name: "Next.js", desc: "Framework Frontend" },
  { name: "TypeScript", desc: "Typage strict" },
  { name: "Tailwind CSS", desc: "Interface utilisateur" },
  { name: "Redux Toolkit", desc: "Gestion d'état" },
  { name: "Vitest", desc: "Tests unitaires" },
];

const infraStack = [
  { name: "FastAPI", desc: "API Backend" },
  { name: "PostgreSQL", desc: "Base de données" },
  { name: "Docker", desc: "Conteneurisation" },
  { name: "Nginx", desc: "Reverse Proxy" },
  { name: "CircleCI", desc: "CI / CD" },
];

function TechCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-foreground/10 bg-surface p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10">
      <span className="text-base font-bold text-foreground">{name}</span>
      <span className="text-xs text-muted">{desc}</span>
    </div>
  );
}

export default function Partners() {
  return (
    <div className="container max-w-7xl mx-auto">
      <div className="text-center">
        <small className="text-base uppercase tracking-widest text-foreground">
          Stack technique
        </small>
        <h2 className="mt-3 mb-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Pensé pour évoluer
        </h2>
        <p className="text-base text-muted mb-4 px-2 md:px-12 lg:px-25">
          Technologies sélectionnées pour leur fiabilité, leurs performances et
          leur maturité.
        </p>
        <div className="flex items-center justify-center gap-3 text-xs text-muted/70 tracking-wide">
          <span>Architecture modulaire</span>
          <span className="text-primary/50">•</span>
          <span>API-first</span>
          <span className="text-primary/50">•</span>
          <span>CI / CD</span>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted/50 mb-4 pl-1">
            Frontend
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {frontendStack.map((tech) => (
              <TechCard key={tech.name} name={tech.name} desc={tech.desc} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted/50 mb-4 pl-1">
            Backend & Infra
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {infraStack.map((tech) => (
              <TechCard key={tech.name} name={tech.name} desc={tech.desc} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
