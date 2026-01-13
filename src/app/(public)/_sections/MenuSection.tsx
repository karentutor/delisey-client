import Image from "next/image";
import type { Product } from "@/types/products";

type Props = {
  products?: Product[];
};

export default function MenuSection({ products = [] }: Props) {
  return (
    <section
      id="menu"
      className="px-4 sm:px-6 lg:px-8 py-12 border-t border-brown-100 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-black text-brown-900">Menu</h2>

        <p className="mt-4 text-brown-700">
          Fresh donuts + coffee favourites, served daily.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl shadow-lg transition hover:-translate-y-0.5 bg-white/80 ring-1 ring-black/5"
            >
              <div className="relative h-44 w-full">
                <Image
                  src={p.imageSrc}
                  alt={p.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-brown-900">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brown-700">
                  {p.description}
                </p>

                {p.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-brown-700 ring-1 ring-amber-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {!products.length ? (
          <div className="mt-6 text-sm text-brown-500">
            No products loaded yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
