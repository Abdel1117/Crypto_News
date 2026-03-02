import { CountDown } from "@/app/components/CountDown/CountDown";
import Image, { StaticImageData } from "next/image";

import visaLogo from "@/public/images/payment_icons/logo-visa.png";
import paypalLogo from "@/public/images/payment_icons/pay-pal.png";
import cardLogo from "@/public/images/payment_icons/contactless.png";
import bitCoinLogo from "@/public/images/payment_icons/bitcoin.png";
import ProgresSale from "../ProgresSale/ProgresSale";

interface logoType {
  src: StaticImageData;
  alt: string;
}

const iconsList: logoType[] = [
  {
    src: visaLogo,
    alt: "Image represantant le logo Visa",
  },
  {
    src: paypalLogo,
    alt: "Image represantant le logo Paypal",
  },
  {
    src: bitCoinLogo,
    alt: "Image represantant le logo Bitcoin",
  },
  {
    src: cardLogo,
    alt: "Image represantant une carte de paiement",
  },
];
export default function Hero() {
  return (
    <section id="section_hero">
      <div className="container max-w-7xl mx-auto px-1 lg:px-0 min-h-[400px] grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Text Block */}
        <div className="lg:col-span-2  self-center text-center lg:text-left ">
          <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-6xl">
            Best selling ICO future Of Trading
            <br />
            <span className="text-primary font-bold">CoinxEX</span>
          </h2>

          <p className="mt-0 mb-[20px] text-base leading-relaxeda text-foreground">
            Simply dummy text of the printing and typesetting industry. Lorem
            Ipsum has been the industry&apos;s standard dummy text ever since
            the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book.
          </p>

          <div className="flex items-center  gap-2.5">
            <button className="flex items-center justify-center rounded-full bg-primary p-4 w-[65px] h-[65px] mr-4 hover:animate-pulse hover:cursor-pointer">
              <svg
                version="1.1"
                id="Layer_1"
                x="0px"
                y="0px"
                viewBox="0 0 330 330"
                style={
                  { enableBackground: "new 0 0 330 330" } as React.CSSProperties
                }
              >
                <path
                  id="XMLID_308_"
                  d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
	c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
	C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z"
                />
              </svg>
            </button>
            <button className="rounded-lg bg-white text-black py-4 px-8 hover:animate-pulse hover:cursor-pointer">
              White Paper
            </button>
          </div>
        </div>

        {/* Countdown Block */}

        <div className="lg:col-span-1">
          <div className="bg-surface text-center h-full lg:px-[30px] py-[40px] rounded-3xl">
            <h2 className="text-primary text-2xl lg:text-5xl  font-bold">
              ICO Ends In:
            </h2>

            <div className="mt-8 mb-12">
              <CountDown
                target={Date?.now() + 80_000}
                className="gap-3"
                unitClassName="bg-black/30"
                valueClassName="text-5xl"
                labelClassName="text-[10px]"
              />
            </div>
            <div className="my-8">
              <ProgresSale
                current={450000}
                goal={900000}
                label="Sale Raised"
                unit="ICOX"
              />
            </div>

            <div>
              <button className="px-8 py-4 bg-primary dark:bg-[#ffffff] rounded-lg text-black font-semibold">
                Sign Up & Buy Token Now
              </button>
            </div>
            <div className="mt-4 flex gap-2.5 flex-wrap justify-center items-center">
              {iconsList.map((val, index) => (
                <Image
                  key={index}
                  width={30}
                  height={30}
                  src={val?.src as unknown as HTMLImageElement}
                  alt={val?.alt}
                  className="dark:bg-white px-0.5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
