"use client";
import { FAQList } from "./FAQList";
import { faqData } from "./faqData";

export const FAQ = () => {
  return (
    <div className="container max-w-7xl  md:px-0 mx-auto">
      <div className="bg-surface rounded-3xl sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center items-center text-center">
          <h2
            id="block-cta-title"
            className="mt-3 text-3xl font-semibold text-foreground sm:text-6xl"
          >
            Questions Fréquentes
          </h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Trouvez les réponses aux questions les plus fréquemment posées sur
            mes services et mon parcours.
          </p>
          <div className="w-full mt-5" />
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <FAQList items={faqData} />
        </div>
      </div>
    </div>
  );
};
