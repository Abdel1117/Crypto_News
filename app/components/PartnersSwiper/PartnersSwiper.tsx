"use client";

import React, { useMemo } from "react";
import Image, { StaticImageData } from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";

import Logo01 from "@/public/images/partners/01.png";
import Logo02 from "@/public/images/partners/02.png";
import Logo03 from "@/public/images/partners/03.png";
import Logo04 from "@/public/images/partners/04.png";
import Logo05 from "@/public/images/partners/05.png";
import Logo06 from "@/public/images/partners/06.png";

type PartnerLogo = {
  src: StaticImageData;
  alt: string;
};

export default function PartnersSwiper() {
  const logos = useMemo<PartnerLogo[]>(
    () => [
      { src: Logo01, alt: "Partner logo 01" },
      { src: Logo02, alt: "Partner logo 02" },
      { src: Logo03, alt: "Partner logo 03" },
      { src: Logo04, alt: "Partner logo 04" },
      { src: Logo05, alt: "Partner logo 05" },
      { src: Logo06, alt: "Partner logo 06" },
    ],
    [],
  );

  // Duplique pour garantir l'overflow sur desktop (sinon tout peut tenir dans le container)
  const slides = useMemo(() => [...logos, ...logos, ...logos], [logos]);

  return (
    <div className="w-full bg-[#000411] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Swiper
          modules={[Autoplay, FreeMode]}
          loop
          watchOverflow={false}
          loopAdditionalSlides={logos.length}
          loopPreventsSliding={false}
          grabCursor
          centeredSlides={false}
          freeMode={{ enabled: true, sticky: false, momentum: false }}
          spaceBetween={16}
          speed={6000}
          autoplay={{
            delay: 1,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          slidesPerView={2}
          breakpoints={{
            768: { slidesPerView: 4, spaceBetween: 24 },
            1024: { slidesPerView: 8, spaceBetween: 24 },
          }}
          className="!py-2"
          aria-label="Partners carousel"
        >
          {slides.map((logo, idx) => (
            <SwiperSlide
              key={`${logo.alt}-${idx}`}
              className="w-full lg:!w-auto"
            >
              <div className="h-16 w-full lg:w-40 flex items-center justify-center">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={160}
                  height={64}
                  className="h-auto w-auto max-h-12 opacity-90"
                  priority={idx < 2}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
