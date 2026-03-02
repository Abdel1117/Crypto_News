import React from "react";
import { PersonaInterface } from "@/app/types/PersonaType/PersonaType";
import { Persona } from "@/app/ui/Persona/Persona";
import Nik from "@/public/images/Team/01.jpg";
import Jd from "@/public/images/Team/02.jpg";
import Haris from "@/public/images/Team/03.jpg";
import Kips from "@/public/images/Team/04.jpg";
import Williamson from "@/public/images/Team/05.jpg";
import Leo from "@/public/images/Team/06.jpg";
import Niks from "@/public/images/Team/07.jpg";

const personaData: PersonaInterface[] = [
  {
    image: Nik,
    altImageDesc: "Portrait de Nik",
    name: "Nik",
    role: "CEO",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
  {
    image: Jd,
    altImageDesc: "Portrait de JD",
    name: "JD",
    role: "CTO",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
  {
    image: Haris,
    altImageDesc: "Portrait de Haris",
    name: "Haris",
    role: "Lead Engineer",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
  {
    image: Kips,
    altImageDesc: "Portrait de Kips",
    name: "Kips",
    role: "Product Designer",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
];

const personaDataAdvisor: PersonaInterface[] = [
  {
    image: Williamson,
    altImageDesc: "Portrait de JD",
    name: "JD",
    role: "CTO",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
  {
    image: Leo,
    altImageDesc: "Portrait de Haris",
    name: "Haris",
    role: "Lead Engineer",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
  {
    image: Niks,
    altImageDesc: "Portrait de Kips",
    name: "Kips",
    role: "Product Designer",
    introduction:
      "when an unknownshil printer took a galley of type and scrambled it to make a type specimen book.",
    socialMedia: [],
  },
];

export default function TeamMember() {
  return (
    <div id="teams_section">
      <div className="container max-w-7xl mx-auto px-1 lg:px-0">
        {/* First Row */}
        <div className="text-center">
          <div className="mt-4 mb-[60px]">
            <small className="text-base uppercase text-foreground">
              Executive team
            </small>
            <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-5xl">
              Team Members
            </h2>
            <p className="px-2 md:px-12 lg:px-25">
              Lorem Ipsum is simply dummy text ever sincehar the 1500s, when an
              unknownshil printer took a galley of type and scrambled it to make
              a type specimen book. It has survived not only five centuries.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-1 sm:px-10 lg:px-5 xl:px-0">
            {personaData?.map((val: PersonaInterface, index: number) => (
              <Persona
                key={index}
                image={val?.image}
                altImageDesc={val?.altImageDesc}
                introduction={val?.introduction}
                name={val?.name}
                role={val?.role}
                socialMedia={val?.socialMedia}
              />
            ))}
          </div>
        </div>
        {/* Second Row */}
        <div className="text-center mt-[60px]">
          <div className="mb-[60px]">
            <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-5xl">
              Executive Advisor
            </h2>
            <p className="px-2 md:px-12 lg:px-25">
              Lorem Ipsum is simply dummy text ever sincehar the 1500s, when an
              unknownshil printer took a galley of type and scrambled it to make
              a type specimen book. It has survived not only five centuries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 px-1 sm:px-10 lg:px-0">
            {personaDataAdvisor?.map((val: PersonaInterface, index: number) => (
              <Persona
                key={index}
                image={val?.image}
                altImageDesc={val?.altImageDesc}
                introduction={val?.introduction}
                name={val?.name}
                role={val?.role}
                socialMedia={val?.socialMedia}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
