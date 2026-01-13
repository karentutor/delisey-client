"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const publicLinks = [
  { href: "/#menu", label: "Menu" },
  { href: "/#hours", label: "Hours" },
  // { href: "/#about", label: "About" },
  // { href: "/#community", label: "Community" },
  { href: "/#map", label: "Find Us" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Styles (kept from your original)
  const navClasses =
    "sticky top-0 inset-x-0 z-50 bg-brown-900/95 border-b border-cream-100/10";

  const linkClasses =
    "px-3 py-2 text-sm font-semibold text-cream-100/90 hover:text-white hover:underline underline-offset-4 rounded " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  const buttonLoginClasses =
    "ml-3 inline-flex items-center rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold " +
    "text-cream-100/90 hover:text-white hover:border-white " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  const orderNowClasses =
    "ml-3 inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white " +
    "hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  return (
    <nav className={navClasses} role="banner">
      <div className="h-16 md:h-20 flex items-center px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/#hero"
          onClick={() => setOpen(false)}
          className="mr-auto text-xl md:text-3xl font-black tracking-tight text-white font-display
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
        >
          Delisey
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {publicLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={linkClasses}
            >
              {l.label}
            </Link>
          ))}

          {/* Optional CTA (kept from original) */}
          <Link
            href="/order"
            onClick={() => setOpen(false)}
            className={orderNowClasses}
          >
            Order Now
          </Link>

          {/* ✅ Only Login */}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={buttonLoginClasses}
          >
            Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md
                     border border-cream-100/30 text-white
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-cream-100/10 bg-brown-900/95 text-white">
          <div className="px-4 sm:px-6 py-3 flex flex-col">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 font-semibold text-cream-100/95 hover:text-white"
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/order"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-center text-white hover:bg-brand-700"
            >
              Order Now
            </Link>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg border border-cream-100/40 px-3 py-2 text-xs font-semibold text-center text-cream-100/90 hover:text-white hover:border-white"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
