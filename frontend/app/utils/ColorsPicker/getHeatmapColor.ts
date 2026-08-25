
export function getHeatmapColor(change: number): string {
  if (change >= 10) return "#065f46";
  if (change >= 5) return "#059669";
  if (change > 0) return "#34d399";
  if (change === 0) return "#475569";
  if (change > -5) return "#f87171";
  if (change > -10) return "#dc2626";
  return "#7f1d1d";
}