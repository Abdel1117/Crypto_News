export default function CandleStickSkeleton() {
  return (
    <div
      role="status"
      className="
        w-full h-full min-w-0 min-h-0 overflow-hidden
        rounded-base shadow-xs animate-pulse
      "
    >
      <div className="h-full min-h-0 flex flex-col p-4 md:p-6">
        <div className="h-2.5 bg-card rounded-full w-32 mb-2.5 shrink-0" />
        <div className="w-48 max-w-full h-2 mb-6 bg-card rounded-full shrink-0" />

        <div className="flex-1 min-h-0 flex items-end gap-3 overflow-hidden">
          {Array.from({ length: 30 }).map((_, index) => {
            /* Array for Height in the graph */
            const heights: number[] = [70, 55, 75, 65, 90, 72, 85, 56, 74, 64];
            /* For the Height of the bar in the graph  */
            const height: number = heights[index % heights.length];

            return (
              <div
                key={index}
                className="min-w-[5px] flex-1 rounded-t-full bg-card"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
