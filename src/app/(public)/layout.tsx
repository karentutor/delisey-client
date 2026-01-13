import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
