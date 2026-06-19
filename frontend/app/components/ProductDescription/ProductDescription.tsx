import React from "react";
import fancy_image_1 from "@/public/images/product/1.png";
import fancy_image_2 from "@/public/images/product/2.png";
import fancy_image_3 from "@/public/images/product/3.png";
import fancy_image_4 from "@/public/images/product/4.png";
import fancy_image_5 from "@/public/images/product/5.png";
import fancy_image_6 from "@/public/images/product/6.png";
import CardProduct from "@/app/components/CardProduct/CardProduct";

export default function ProductDescription() {
  const products = [
    {
      image: fancy_image_1,
      title: "Suivi en temps réel",
      paragraphe:
        "Cours mis à jour en direct sur les principales cryptomonnaies. Visualisez variations, volumes et capitalisations d'un coup d'œil.",
    },
    {
      image: fancy_image_2,
      title: "Tableau de bord personnalisé",
      paragraphe:
        "Créez et gérez votre propre liste de suivi. Chaque actif que vous surveillez est centralisé dans un espace dédié.",
    },
    {
      image: fancy_image_3,
      title: "Simulation de portefeuille",
      paragraphe:
        "Testez vos stratégies d'investissement sans risque réel. Achetez, vendez, analysez vos résultats en conditions de marché live.",
    },
    {
      image: fancy_image_4,
      title: "Graphiques & analytique",
      paragraphe:
        "Graphiques en chandeliers japonais, indicateurs de tendance et historique des prix pour affiner vos décisions.",
    },
    {
      image: fancy_image_5,
      title: "Intégration wallet",
      paragraphe:
        "Connectez votre wallet pour une vue consolidée de vos actifs réels et simulés au même endroit.",
    },
    {
      image: fancy_image_6,
      title: "Interface intuitive",
      paragraphe:
        "Design sombre pensé pour la lisibilité, entièrement responsive. Accessible depuis desktop et mobile sans friction.",
    },
  ];
  return (
    <div id="product_description">
      <div className="container max-w-7xl mx-auto ">
        <div className="text-center">
          <small className="text-base uppercase text-foreground">
            Fonctionnalités
          </small>
          <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-5xl">
            Ce que vous pouvez faire avec CoinxEX
          </h2>
          <p className="px-2 md:px-12 lg:px-25 text-muted">
            Un outil pensé pour les investisseurs autonomes — du débutant qui
            veut comprendre le marché au trader qui cherche à affiner ses
            stratégies sans friction.
          </p>
        </div>

        <div className="mt-[160px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-30 px-2 sm:px-1 xl:px-0">
          {products?.map((val, keys) => (
            <CardProduct
              key={keys}
              image={val?.image}
              title={val?.title}
              paragraphe={val?.paragraphe}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
