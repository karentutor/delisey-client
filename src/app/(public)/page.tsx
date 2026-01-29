// app/page.tsx (or wherever your HomePage is)
import HeroSection from "./_sections/HeroSection";
import MenuSection from "./_sections/MenuSection";
import HoursSection from "./_sections/HoursSection";
import AboutSection from "./_sections/AboutSection";
import MapSection from "./_sections/MapSection";
import ContactSection from "./_sections/ContactSection";
import { products } from "@/data/products";

export default function HomePage() {
  return (
    <main className="bg-cream-50 text-brown-900">
      <HeroSection />
      <MenuSection products={products} />
      <HoursSection />
      <MapSection />
      <ContactSection />
    </main>
  );
}
