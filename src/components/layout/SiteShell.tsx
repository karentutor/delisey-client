import type { ReactNode } from "react";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/footer/Footer";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
