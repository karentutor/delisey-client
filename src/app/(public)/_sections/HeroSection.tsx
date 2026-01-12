"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export default function HeroSection() {
  const focalYPercent = 50;

  const objectPosition = useMemo(
    () => `center ${clamp(focalYPercent, 0, 100)}%`,
    [focalYPercent]
  );

  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div className="relative h-[72vh] min-h-[34rem] w-full">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/donuts-day.jpg"
            alt="Fresh donuts at Delisey"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition }}
          />
        </div>

        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/65" />

        {/* Content */}
        <div className="absolute inset-0 z-30 flex items-center justify-center text-center">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-white">
              <div className="rounded-3xl bg-black/35 backdrop-blur-md border border-white/15 shadow-2xl px-6 py-8 sm:px-10 sm:py-10">
                <div className="mx-auto inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur border border-white/20">
                  Now serving
                </div>

                <h1 className="mt-4 text-5xl sm:text-6xl font-black tracking-tight">
                  Delisey
                </h1>

                <p className="mt-4 text-lg sm:text-xl text-white/90 leading-relaxed">
                  Coffee • donuts • fresh baked goodness in Parksville.
                </p>

                {/* Order CTA */}
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/order"
                    className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
