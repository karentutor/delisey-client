'use client';

import { useEffect, useState } from 'react';
import { backendApi } from '../../../lib/backendApi';
import Link from 'next/link';

type Order = {
  _id: string;
  createdAt: string;
  boxSize: number;
  donuts: { chocolate: number; glazed: number; plain: number };
  status: string;
  checkout?: { method?: string; url?: string };
  square?: { checkoutId?: string; squareOrderId?: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<{ email: string; name?: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMsg(null);
      try {
        const meRes = await backendApi.get('/api/auth/me');
        setMe(meRes.data.user);

        const ordersRes = await backendApi.get('/api/orders/me');
        setOrders(ordersRes.data);
      } catch (err: any) {
        setMsg(err?.response?.data?.message || 'Please login to view orders.');
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Orders</h1>

        <div className="flex items-center gap-3">
          <Link className="text-sm underline" href="/login">
            Login
          </Link>
          <Link className="text-sm underline" href="/register">
            Register
          </Link>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm"
            onClick={async () => {
              await backendApi.post('/api/auth/logout');
              setMe(null);
              setOrders([]);
              setMsg('Logged out.');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {me && (
        <p className="mt-2 text-sm text-black/70">
          Signed in as <span className="font-medium">{me.email}</span>
        </p>
      )}

      {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}

      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Order #{o._id.slice(-6)}</div>
              <div className="text-xs text-black/60">
                {new Date(o.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-2 text-sm">
              Box of {o.boxSize}: {o.donuts.chocolate} choc, {o.donuts.glazed} glazed, {o.donuts.plain} plain
            </div>

            <div className="mt-2 text-sm">
              Status: <span className="font-medium">{o.status}</span>
            </div>

            {(o.square?.checkoutId || o.square?.squareOrderId) && (
              <div className="mt-2 text-xs text-black/70">
                Square checkoutId: {o.square.checkoutId || '—'} | Square orderId: {o.square.squareOrderId || '—'}
              </div>
            )}

            {o.checkout?.url && (
              <a
                href={o.checkout.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm underline"
              >
                Open checkout
              </a>
            )}
          </div>
        ))}

        {!msg && orders.length === 0 && (
          <p className="text-sm text-black/70">No orders yet.</p>
        )}
      </div>
    </main>
  );
}
