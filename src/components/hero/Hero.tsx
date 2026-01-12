"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";

type HeroProps = {
  title: string;
  subtitle?: string;

  /** Image in /public/images/... */
  imageSrc: string;
  imageAlt: string;

  badge?: string;
  focalYPercent?: number;

  /** Order button */
  orderHref?: string; // default "/order"
  orderText?: string; // default "Order Now"
};

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export default function Hero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  badge,
  focalYPercent = 50,
  orderHref = "/order",
  orderText = "Order Now",
}: HeroProps) {
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
            src={imageSrc}
            alt={imageAlt}
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
                {badge && (
                  <div className="mx-auto inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur border border-white/20">
                    {badge}
                  </div>
                )}

                <h1 className="mt-4 text-5xl sm:text-6xl font-black tracking-tight">
                  {title}
                </h1>

                {subtitle && (
                  <p className="mt-4 text-lg sm:text-xl text-white/90 leading-relaxed">
                    {subtitle}
                  </p>
                )}

                {/* ✅ Order button (replaces Day/Night toggle) */}
                <div className="mt-8 flex justify-center">
                  <Link
                    href={orderHref}
                    className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    {orderText}
                  </Link>
                </div>

                {/* Optional: secondary link (comment in if you want) */}
                {/*
                <div className="mt-4 flex justify-center">
                  <Link
                    href="/#menu"
                    className="text-sm font-semibold text-white/90 hover:text-white underline underline-offset-4"
                  >
                    View Menu
                  </Link>
                </div>
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
