export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[1440px] px-5 pt-11 pb-16 lg:px-[120px] lg:pt-[72px] lg:pb-24"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Chargement des articles…</span>

      <header className="mb-8 lg:mb-10">
        <div className="n-skeleton h-4 w-12" />
        <div className="n-skeleton mt-4 h-10 w-full max-w-[420px] lg:h-12" />
        <div className="n-skeleton mt-4 h-4 w-full max-w-[520px]" />
      </header>

      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="n-skeleton h-10 w-20 flex-none lg:h-9" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="n-skeleton min-h-[340px] lg:min-h-[460px]" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="n-skeleton h-[88px]" />
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="n-skeleton h-[240px]" />
        ))}
      </div>
    </main>
  );
}
