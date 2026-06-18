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
    captionTitle: "Comprendre le marché",
    title: "Des données en temps réel,",
    underTitle: "sans la complexité.",
    firstParma:
      "CoinxEX agrège les cours des principales cryptomonnaies et les présente dans un tableau de bord lisible — variations, volumes, capitalisation — accessible en quelques secondes.",
    secondParam:
      "Ajoutez les actifs qui vous intéressent à votre watchlist personnelle et suivez leur évolution sans quitter votre espace de travail.",
    boutonText: "Accéder au dashboard",
    boutonHref: "/dashboard",
  };

  const SecondBlockCTAText = {
    imageSrc: secondHeroImage,
    captionTitle: "Simuler avant d'investir",
    title: "Testez vos stratégies",
    underTitle: "sans risque réel.",
    firstParma:
      "La simulation de portefeuille vous permet d'acheter et de vendre des cryptomonnaies aux prix réels du marché, avec un capital virtuel. Analysez vos résultats, ajustez votre approche.",
    secondParam:
      "Aucun compte broker, aucune mise de fonds. Juste un environnement fidèle au marché pour affiner votre stratégie avant de passer à l'acte.",
    boutonText: "Lancer la simulation",
    boutonHref: "/dashboard",
  };

  return (
    <main className="p-2 sm:p-6 xl:p-0 relative z-50">
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
