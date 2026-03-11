import Image, { StaticImageData } from "next/image";
import React from "react";

interface cardProps {
  image: StaticImageData;
  title: string;
  paragraphe: string;
}

export default function CardProduct({ image, title, paragraphe }: cardProps) {
  return (
    <div className="overflow-visible bg-surface px-5 pb-5 flex flex-col items-center justify-between gap-5">
      <div className="w-full">
        <Image
          className="mx-auto -mt-[88px] "
          src={image}
          width={200}
          height={200}
          alt="Image a titre décoratifs"
          priority={false}
        />

        <div className="text-center mb-[25px]">
          <h2 className="text-2xl font-bold my-5">{title}</h2>
          <p className="text-md mx-auto max-w-[34ch] leading-7 line-clamp-3">
            {paragraphe}
          </p>
        </div>
      </div>
    </div>
  );
}
