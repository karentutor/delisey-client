export default function OrderPage() {
  return (
    <main className="bg-cream-50 text-brown-900 min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight">
          Order
        </h1>

        <p className="mt-6 max-w-2xl text-brown-700 leading-relaxed">
          Online ordering is coming soon. You’ll be able to order donuts and
          drinks for pickup directly from Delisey.
        </p>

        <div className="mt-10 rounded-2xl border border-brown-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">What’s coming</h2>
          <ul className="mt-4 space-y-2 text-sm text-brown-700 list-disc list-inside">
            <li>Pickup ordering</li>
            <li>Limited daily quantities</li>
            <li>Pay online or at pickup</li>
            <li>Seasonal menus</li>
          </ul>
        </div>

        <div className="mt-10 text-sm text-brown-600">
          Questions? Check back soon or visit us in person.
        </div>
      </div>
    </main>
  );
}
