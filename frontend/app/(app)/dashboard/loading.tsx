export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Chargement du dashboard"
    >
      <div className="n-skeleton h-6 w-40" />
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="n-skeleton h-[104px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="n-skeleton h-[380px]" />
        <div className="n-skeleton h-[380px]" />
      </div>
    </div>
  );
}
