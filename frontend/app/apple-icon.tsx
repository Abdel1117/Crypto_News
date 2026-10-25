import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon: same glyph as BrandMark, but on a full-bleed square
 * (iOS rounds the corners itself and fills transparency with black).
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="-5 -5 42 42">
        <rect x="-5" y="-5" width="42" height="42" fill="#9184d9" />
        <path
          fill="#161826"
          d="M21.002 9.855A7.95 7.95 0 0 1 24 15.278l-2.847-.708a5.360 5.360 0 0 0-3.860-3.667c-2.866-.713-5.760.991-6.465 3.806s1.050 5.675 3.917 6.388a5.370 5.370 0 0 0 5.134-1.430l2.847.707a7.970 7.970 0 0 1-5.200 3.385L16.716 27l-2.596-.645l.644-2.575a8 8 0 0 1-1.298-.323l-.643 2.575l-2.596-.646l.810-3.241c-2.378-1.875-3.575-4.996-2.804-8.081s3.297-5.281 6.280-5.823L15.323 5l2.596.645l-.644 2.575a8 8 0 0 1 1.298.323l.643-2.575l2.596.646z"
        />
      </svg>
    ),
    size,
  );
}
