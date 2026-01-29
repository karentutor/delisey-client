'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { backendApi } from '../../../lib/backendApi';

function ForgotPasswordInner() {
  const searchParams = useSearchParams();

  const next = searchParams.get('next') || '/orders';
  const safeNext = next.startsWith('/') ? next : '/orders';
  const nextEncoded = encodeURIComponent(safeNext);

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3, [email]);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Forgot password</h1>

      <p className="mt-2 text-sm text-black/70">
        Enter your email. If an account exists, you’ll receive a reset link.
      </p>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          setResetUrl(null);
          setLoading(true);

          try {
            const res = await backendApi.post('/auth/forgot-password', {
              email: email.trim(),
              next: safeNext,
            });

            setMsg(res.data?.message || 'If an account exists, a reset link has been sent.');

            // DEV ONLY: if your backend returns resetUrl (optional)
            if (res.data?.resetUrl) {
              setResetUrl(String(res.data.resetUrl));
            }
          } catch (err: any) {
            setMsg(err?.response?.data?.message || 'Request failed. Please try again.');
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

        <button
          disabled={loading || !canSubmit}
          className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        {msg && <p className="text-sm text-black/80">{msg}</p>}

        {resetUrl && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-semibold">Dev reset link (click):</p>
            <a className="break-words underline" href={resetUrl}>
              {resetUrl}
            </a>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-sm">
          <Link className="underline" href={`/login?next=${nextEncoded}`}>
            Back to login
          </Link>
          <Link className="underline" href={`/register?next=${nextEncoded}`}>
            Create account
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10">
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="mt-3 text-sm text-black/70">Loading…</p>
        </main>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  );
}
