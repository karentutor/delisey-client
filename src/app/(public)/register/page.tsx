'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { backendApi } from '../../../lib/backendApi';

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get('next') || '/orders';
  const safeNext = next.startsWith('/') ? next : '/orders';
  const nextEncoded = useMemo(() => encodeURIComponent(safeNext), [safeNext]);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          setLoading(true);

          try {
            await backendApi.post('/auth/register', {
              email,
              name,
              password,
            });

            // ✅ tell navbar to refresh
            window.dispatchEvent(new Event('delisey-auth-changed'));

            router.push(safeNext);
          } catch (err: any) {
            setMsg(err?.response?.data?.message || 'Registration failed.');
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Register'}
        </button>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <p className="mt-2 text-sm text-black/70">
          Already have an account?{' '}
          <Link className="underline" href={`/login?next=${nextEncoded}`}>
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-3 text-sm text-black/70">Loading…</p>
        </main>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}
