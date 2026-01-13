export default function HoursSection() {
  return (
    <section
      id="hours"
      className="px-4 sm:px-6 lg:px-8 py-12 border-t border-brown-100 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-black">Hours</h2>

        <p className="mt-4 text-brown-700">
          Qualicum Beach Farmers Market
        </p>

        <div className="mt-6 rounded-xl border border-brown-200 bg-white px-6 py-4 text-brown-800 shadow-sm">
          <p className="font-semibold">Example:</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Saturday: 8:30am – 12:00pm</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
