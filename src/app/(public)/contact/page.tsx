'use client';

import { useState } from 'react';
import { backendApi } from '../../../lib/backendApi';

type Status = { type: 'success' | 'error'; message: string } | null;

const LABEL = 'text-sm font-semibold text-neutral-800';
const INPUT =
  'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 ' +
  'placeholder:text-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20';
const SELECT =
  'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 ' +
  'shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20';
const TEXTAREA =
  'block w-full min-h-[140px] rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 ' +
  'placeholder:text-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/20';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General inquiry');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">Contact</h1>

      <p className="mt-2 text-neutral-700">
        Questions about preorders, market pickup, or custom boxes? Send us a note and we’ll get back to you.
      </p>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {/* Form title */}
        <h2 className="mb-1 text-xl font-bold text-neutral-900">Contact Us</h2>
        <p className="mb-5 text-sm text-neutral-600">We usually reply within 24 hours.</p>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus(null);
            setLoading(true);

            try {
              await backendApi.post('/api/contact', { name, email, subject, message });

              setStatus({ type: 'success', message: 'Thanks! Your message has been sent.' });
              setName('');
              setEmail('');
              setSubject('General inquiry');
              setMessage('');
            } catch (err: any) {
              setStatus({
                type: 'error',
                message:
                  err?.response?.data?.message || 'Sorry — we could not send your message right now.',
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL}>Name</label>
              <input
                className={INPUT}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={LABEL}>Email</label>
              <input
                className={INPUT}
                placeholder="you@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Subject</label>
            <select className={SELECT} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="General inquiry">General inquiry</option>
              <option value="Preorder / pickup">Preorder / pickup</option>
              <option value="Catering / large order">Catering / large order</option>
              <option value="Allergens">Allergens</option>
              <option value="Wholesale / partnership">Wholesale / partnership</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Message</label>
            <textarea
              className={TEXTAREA}
              placeholder="Tell us what you need…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 font-semibold text-white hover:bg-black/90 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send Message'}
          </button>

          {status && (
            <p
              className={`text-sm ${
                status.type === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {status.message}
            </p>
          )}

          {/* <div className="pt-2 text-sm text-neutral-600">
            Or email us directly:{' '}
            <a className="underline text-neutral-900" href="mailto:anne@delisey.com">
              anne@delisey.com
            </a>
          </div> */}

          <div className="pt-2 text-sm text-neutral-600">
  Prefer email? Use this form — it goes directly to our team.
</div>

        </form>
      </div>
    </main>
  );
}
