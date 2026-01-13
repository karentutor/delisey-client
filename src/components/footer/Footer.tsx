import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="bg-brown-900/95 border-t border-cream-100/10"
      role="contentinfo"
    >
      <div className="h-14 flex items-center justify-end px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="text-sm font-semibold text-cream-100/80 hover:text-white hover:underline underline-offset-4 rounded
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
