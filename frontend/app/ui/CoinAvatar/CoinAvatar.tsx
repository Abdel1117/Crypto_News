import Image from "next/image";

interface CoinAvatarProps {
  image?: string;
  name: string;
  symbol: string;
  size?: number;
}

/**
 * The coin's own icon (CoinGecko image), with the design's monogram disc as a
 * fallback when the API returns no image.
 */
export default function CoinAvatar({
  image,
  name,
  symbol,
  size = 28,
}: CoinAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="flex-none rounded-full"
        style={{ width: size, height: size }}
        title={name}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex-none rounded-full grid place-items-center font-medium bg-(--n-neutral-800) text-(--n-neutral-200)"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {symbol.charAt(0).toUpperCase()}
    </span>
  );
}
