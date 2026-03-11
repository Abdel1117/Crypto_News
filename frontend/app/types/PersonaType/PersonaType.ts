import { StaticImageData } from "next/image";

export interface socialMediaLinkInterface {
  icon: StaticImageData;
  link: string;
}

export interface PersonaInterface {
  image: StaticImageData;
  altImageDesc: string;
  name: string;
  role: string;
  introduction: string;
  socialMedia: socialMediaLinkInterface[];
}