import HeroSection from "./_sections/HeroSection";
import MenuSection from "./_sections/MenuSection";
import HoursSection from "./_sections/HoursSection";
import AboutSection from "./_sections/AboutSection";
import MapSection from "./_sections/MapSection";

export default function HomePage() {
  return (
    <main className="bg-cream-50 text-brown-900">
      <HeroSection />
      <MenuSection />
      <HoursSection />
      <AboutSection />
      <MapSection />
    </main>
  );
}
