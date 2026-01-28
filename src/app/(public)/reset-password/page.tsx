'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { backendApi } from '../../../lib/backendApi';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const next = searchParams.get('next') || '/orders';
  const safeNext = next.startsWith('/') ? next : '/orders';
  const nextEncoded = encodeURIComponent(safeNext);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwError = useMemo(() => {
    if (!password && !confirm) return null;
    if (password.length > 0 && password.length < 8) return 'Password must be at least 8 characters.';
    if (confirm && password !== confirm) return 'Passwords do not match.';
    return null;
  }, [password, confirm]);

  const canSubmit = token && !pwError && password.length >= 8 && password === confirm;

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-3 text-sm text-red-600">Missing reset token.</p>
        <div className="mt-6 text-sm">
          <Link className="underline" href={`/forgot-password?next=${nextEncoded}`}>
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Reset password</h1>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          setLoading(true);

          try {
            await backendApi.post('/api/auth/reset-password', {
              token,
              password,
            });
            window.dispatchEvent(new Event('delisey-auth-changed')); 

            // ✅ backend sets auth cookie on success
            router.push(safeNext);
          } catch (err: any) {
            setMsg(err?.response?.data?.message || 'Reset failed. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="New password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button
          disabled={loading || !canSubmit}
          className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Resetting…' : 'Reset password'}
        </button>

        <div className="mt-2 text-sm">
          <Link className="underline" href={`/login?next=${nextEncoded}`}>
            Back to login
          </Link>
        </div>
      </form>
    </main>
  );
}
