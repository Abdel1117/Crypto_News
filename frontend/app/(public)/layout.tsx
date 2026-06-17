import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { ParticlesBg } from "../components/ParticleBg/ParticleBG";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <ParticlesBg />

      {children}
      <Footer />
    </>
  );
}
