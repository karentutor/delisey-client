'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { backendApi } from '../../../lib/backendApi';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get('next') || '/orders';
  const safeNext = next.startsWith('/') ? next : '/orders';
  const nextEncoded = useMemo(() => encodeURIComponent(safeNext), [safeNext]);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Login</h1>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          setLoading(true);

          try {
            await backendApi.post('/auth/login', { email, password });

            // ✅ tell navbar to refresh
            window.dispatchEvent(new Event('delisey-auth-changed'));

            router.push(safeNext);
          } catch (err: any) {
            setMsg(err?.response?.data?.message || 'Login failed.');
          } finally {
            setLoading(false);
          }
        }}
      >
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
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <div className="mt-2 flex items-center justify-between text-sm">
          <Link className="underline" href={`/register?next=${nextEncoded}`}>
            Create account
          </Link>

          <Link className="underline" href={`/forgot-password?next=${nextEncoded}`}>
            Forgot password?
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-3 text-sm text-black/70">Loading…</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
