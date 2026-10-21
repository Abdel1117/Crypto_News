export interface TreemapRect<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Squarified treemap (Bruls, Huizing & van Wijk): lays `items` out in a
 * `width` × `height` box, each area proportional to `value(item)`, keeping
 * tiles as close to square as possible. Items are laid out in the given
 * order, so pass them sorted by decreasing value.
 */
export function squarify<T>(
  items: T[],
  value: (item: T) => number,
  width: number,
  height: number,
): TreemapRect<T>[] {
  const total = items.reduce((sum, it) => sum + Math.max(0, value(it)), 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];

  const scale = (width * height) / total;
  const nodes = items
    .map((item) => ({ item, area: Math.max(0, value(item)) * scale }))
    .filter((n) => n.area > 0);

  const out: TreemapRect<T>[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;

  // Worst aspect ratio of a row laid along a side of length `side`.
  const worst = (row: typeof nodes, side: number) => {
    if (row.length === 0) return Infinity;
    let sum = 0;
    let max = 0;
    let min = Infinity;
    for (const n of row) {
      sum += n.area;
      max = Math.max(max, n.area);
      min = Math.min(min, n.area);
    }
    return Math.max(
      (side * side * max) / (sum * sum),
      (sum * sum) / (side * side * min),
    );
  };

  const place = (row: typeof nodes) => {
    const sum = row.reduce((s, n) => s + n.area, 0);
    if (w >= h) {
      const colWidth = sum / h;
      let yy = y;
      for (const n of row) {
        const nh = n.area / colWidth;
        out.push({ item: n.item, x, y: yy, w: colWidth, h: nh });
        yy += nh;
      }
      x += colWidth;
      w -= colWidth;
    } else {
      const rowHeight = sum / w;
      let xx = x;
      for (const n of row) {
        const nw = n.area / rowHeight;
        out.push({ item: n.item, x: xx, y, w: nw, h: rowHeight });
        xx += nw;
      }
      y += rowHeight;
      h -= rowHeight;
    }
  };

  let row: typeof nodes = [];
  let i = 0;
  while (i < nodes.length) {
    const side = Math.min(w, h);
    const next = nodes[i];
    if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) {
      row.push(next);
      i++;
    } else {
      place(row);
      row = [];
    }
  }
  if (row.length) place(row);

  return out;
}
