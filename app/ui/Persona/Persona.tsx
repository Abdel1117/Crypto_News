import Image from "next/image";
import Link from "next/link";
import {
  PersonaInterface,
  socialMediaLinkInterface,
} from "@/app/types/PersonaType/PersonaType";

export const Persona = ({
  image,
  altImageDesc,
  name,
  role,
  introduction,
  socialMedia,
}: PersonaInterface) => {
  return (
    <div>
      <div className="mx-auto flex justify-center items-center">
        <Image
          className="rounded-full outline-2"
          src={image}
          alt={altImageDesc}
        />
      </div>
      <div className="mt-6">
        <h3 className="text-xl">
          <strong>{name}</strong>
        </h3>
        <small className=" block text-primary font-semibold text-sm mt-[5px] mb-[20px] ">
          {role}
        </small>
        <p className="text-base text-foreground mb-[16px]">{introduction}</p>
      </div>
      {socialMedia?.map((val: socialMediaLinkInterface, index: number) => (
        <div className="rounded-full outline-2" key={index}>
          <Link href={val?.link}>
            <Image src={val?.icon} alt="Icon de reseau social" />
          </Link>
        </div>
      ))}
    </div>
  );
};
