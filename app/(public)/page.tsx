import BlockCTA from "../components/BlockCTA/BlockCTA";
import Hero from "../components/Hero/Hero";
import ProductDescription from "../components/ProductDescription/ProductDescription";
import heroImage from "@/public/images/01.png";
import secondHeroImage from "@/public/images/02.png";
import TeamMember from "../components/TeamMembers/TeamMember";
import Partners from "../components/Partners/Partners";
import PartnersSwiper from "../components/PartnersSwiper/PartnersSwiper";
import { ContactForm } from "../components/ContactForm/ContactForm";
import { FAQ } from "../components/FAQ/FAQ";
import RoadMap from "../components/RoadMap/RoadMap";

export default function Home() {
  const BlockCTAText = {
    imageSrc: heroImage,
    captionTitle: " wow Awesome ",
    title: "ICO Launching Page for",
    underTitle: "Your COINEX.",
    firstParma:
      "Here is 3 Easy Steps to Busy & Sell Bitcoin. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
    secondParam:
      "Here is 3 Easy Steps to Busy & Sell Bitcoin. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. ",
    boutonText: "Buy Token",
    boutonHref: "/buytoken",
  };

  const SecondBlockCTAText = {
    imageSrc: secondHeroImage,
    captionTitle: " wow Awesome ",
    title: "ICO Launching Page for",
    underTitle: "Your COINEX.",
    firstParma:
      "Here is 3 Easy Steps to Busy & Sell Bitcoin. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
    secondParam:
      "Here is 3 Easy Steps to Busy & Sell Bitcoin. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. ",
    boutonText: "Buy Token",
    boutonHref: "/buytoken",
  };

  return (
    <main>
      <section className="pb-[100px]">
        <Hero />
      </section>
      <section className="pb-[100px]">
        <PartnersSwiper />
      </section>
      <section className="pb-[100px]">
        <BlockCTA
          imageSrc={BlockCTAText?.imageSrc}
          captionTitle={BlockCTAText?.captionTitle}
          title={BlockCTAText?.title}
          underTitle={BlockCTAText?.underTitle}
          firstParam={BlockCTAText?.firstParma}
          secondParam={BlockCTAText?.secondParam}
          boutonText={BlockCTAText?.boutonText}
          boutonHref={BlockCTAText?.boutonHref}
          notReversed={false}
          hidebutton={false}
        />
      </section>
      <section className="pb-[100px]">
        <BlockCTA
          imageSrc={SecondBlockCTAText?.imageSrc}
          captionTitle={SecondBlockCTAText?.captionTitle}
          title={SecondBlockCTAText?.title}
          underTitle={SecondBlockCTAText?.underTitle}
          firstParam={SecondBlockCTAText?.firstParma}
          secondParam={SecondBlockCTAText?.secondParam}
          boutonText={SecondBlockCTAText?.boutonText}
          boutonHref={SecondBlockCTAText?.boutonHref}
          notReversed={true}
          hidebutton={true}
        />
      </section>
      <section className="pb-[100px]">
        <ProductDescription />
      </section>
      <section className="pb-[100px]">
        <RoadMap />
      </section>
      <section className="pb-[100px]">
        <TeamMember />
      </section>
      <section className="pb-[100px]">
        <Partners />
      </section>
      <section className="pb-[100px]">
        <FAQ />
      </section>
      <section className="pb-[100px]">
        <ContactForm />
      </section>
    </main>
  );
}
