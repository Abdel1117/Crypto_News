import React from "react";
import Dummy_Logo_1 from "@/public/images/partners/01.png";
import Dummy_Logo_2 from "@/public/images/partners/02.png";
import Dummy_Logo_3 from "@/public/images/partners/03.png";
import Dummy_Logo_4 from "@/public/images/partners/04.png";
import Dummy_Logo_5 from "@/public/images/partners/05.png";
import Dummy_Logo_6 from "@/public/images/partners/06.png";
import Image, { StaticImageData } from "next/image";

interface logoInterface {
  image: StaticImageData;
  alt: string;
}
export default function Partners() {
  const DummyLogoArray: logoInterface[] = [
    {
      image: Dummy_Logo_1,
      alt: "Dummy_Logo_1",
    },
    {
      image: Dummy_Logo_2,
      alt: "Dummy_Logo_2",
    },
    {
      image: Dummy_Logo_3,
      alt: "Dummy_Logo_3",
    },
    {
      image: Dummy_Logo_4,
      alt: "Dummy_Logo_4",
    },
    {
      image: Dummy_Logo_5,
      alt: "Dummy_Logo_5",
    },
    {
      image: Dummy_Logo_6,
      alt: "Dummy_Logo_6",
    },
    {
      image: Dummy_Logo_1,
      alt: "Dummy_Logo_1",
    },
    {
      image: Dummy_Logo_4,
      alt: "Dummy_Logo_4",
    },
    {
      image: Dummy_Logo_4,
      alt: "Dummy_Logo_4",
    },
    {
      image: Dummy_Logo_5,
      alt: "Dummy_Logo_5",
    },
    {
      image: Dummy_Logo_4,
      alt: "Dummy_Logo_4",
    },
    {
      image: Dummy_Logo_5,
      alt: "Dummy_Logo_5",
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto">
      <div className="text-center">
        <small className="text-base text-foreground uppercase">
          Executive Partners
        </small>
        <h2 className="text-2xl font-semibold md:text-6xl pb-[15px]">
          Partners & Supporters
        </h2>
        <p className="text-base text-foreground mb-4">
          Lorem Ipsum is simply dummy text ever sincehar the 1500s, when an
          unknownshil printer took a galley of type and scrambled it to make a
          type specimen book. It has survived not only five centuries.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-5 gap-y-10 mt-[60px]">
        {DummyLogoArray?.map((val: logoInterface, index: number) => (
          <div
            className="w-full h-auto flex items-center justify-center lg:justify-start"
            key={index}
          >
            <Image src={val.image} width={130} height={130} alt={val.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
