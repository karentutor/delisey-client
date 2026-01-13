import { CONTACT, phoneToTel, getMapEmbedUrl } from "@/config/contact";

export default function MapSection() {
  const { address, phone } = CONTACT;

  // ✅ This will build the embed URL from the address if NEXT_PUBLIC_MAP_EMBED_URL is missing
  const embedUrl = getMapEmbedUrl();

  if (!embedUrl) {
    return (
      <section
        id="map"
        className="px-4 sm:px-6 lg:px-8 py-12 border-t border-brown-100 scroll-mt-24"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black text-brown-900">Find Us</h2>

          <p className="mt-4 rounded-xl bg-white/80 p-6 text-sm text-brown-700 shadow-sm ring-1 ring-black/5">
            Map is not configured. Add{" "}
            <code className="font-mono text-[13px]">NEXT_PUBLIC_ADDRESS</code> (or{" "}
            <code className="font-mono text-[13px]">NEXT_PUBLIC_MAP_EMBED_URL</code>) to{" "}
            <code className="font-mono text-[13px]">.env.local</code>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="map"
      className="px-4 sm:px-6 lg:px-8 py-12 border-t border-brown-100 scroll-mt-24"
      aria-labelledby="map-title"
    >
      <div className="mx-auto max-w-5xl">
        <h2 id="map-title" className="text-2xl font-black text-brown-900">
          Find Us
        </h2>

        <div className="mt-3 text-brown-700">
          {address ? <p>{address}</p> : null}

          {phone ? (
            <p className="mt-1">
              <a
                href={phoneToTel(phone)}
                className="font-semibold text-brown-800 hover:text-brown-900 hover:underline underline-offset-4"
              >
                {phone}
              </a>
            </p>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
          <iframe
            src={embedUrl} // ✅ use computed embed URL
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            aria-label="Google Map showing our location"
          />
        </div>

        {address ? (
          <div className="mt-6">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                address
              )}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white shadow hover:bg-brand-700 transition"
            >
              Get Directions
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
