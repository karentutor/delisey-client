
'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { backendApi } from '../../../lib/backendApi';
import { useAuth } from '../../../context/AuthContext';

type BoxSize = 1 | 2 | 4 | 6;

type DonutCounts = {
  chocolate: number;
  glazed: number;
  plain: number;
};

type FormValues = {
  boxSize: BoxSize;
  donuts: DonutCounts;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
};

const BOXES: { size: BoxSize; priceLabel: string }[] = [
  { size: 1, priceLabel: '$3.50' },
  { size: 2, priceLabel: '$7' },
  { size: 4, priceLabel: '$12' },
  { size: 6, priceLabel: '$18' },
];


function toNonNegInt(v: unknown) {
  const n =
    typeof v === 'number' ? v : typeof v === 'string' ? Number.parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function total(d: DonutCounts) {
  return d.chocolate + d.glazed + d.plain;
}

function buildOrderNote(boxSize: BoxSize, donuts: DonutCounts, customer: FormValues['customer']) {
  const mix = `Donut mix (Box of ${boxSize}): ${donuts.chocolate} chocolate dipped, ${donuts.glazed} glazed, ${donuts.plain} plain.`;

  const contactParts: string[] = [];
  if (customer.name.trim()) contactParts.push(`Name: ${customer.name.trim()}`);
  if (customer.phone.trim()) contactParts.push(`Phone: ${customer.phone.trim()}`);
  if (customer.email.trim()) contactParts.push(`Email: ${customer.email.trim()}`);

  return contactParts.length ? `${mix} | ${contactParts.join(' | ')}` : mix;
}

function mixMismatchMessage(remaining: number) {
  if (remaining === 0) return null;

  if (remaining > 0) {
    return `Please choose ${remaining} more donut${remaining === 1 ? '' : 's'} to fill the box.`;
  }

  const remove = Math.abs(remaining);
  return `Please remove ${remove} donut${remove === 1 ? '' : 's'} to match the box size.`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type CheckoutResponse = {
  ok: boolean;
  orderId?: string;
  status?: string;
  checkoutUrl?: string;
  guestToken?: string;
  message?: string;
};

export default function OrderPage() {
  const { me, authChecked, authError } = useAuth();
  const router = useRouter();

  const {
    control,
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      boxSize: 4,
      donuts: { chocolate: 0, glazed: 0, plain: 0 },
      customer: { name: '', phone: '', email: '' },
    },
  });

  const [status, setStatus] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'error'; message: string }
    | { state: 'info'; message: string }
  >({ state: 'idle' });

  const [manualCheckoutUrl, setManualCheckoutUrl] = useState<string | null>(null);

  const [mixAttempted, setMixAttempted] = useState(false);
  const [contactAttempted, setContactAttempted] = useState(false);

  const boxSize = useWatch({ control, name: 'boxSize' });
  const donuts = useWatch({ control, name: 'donuts' });
  const customer = useWatch({ control, name: 'customer' });

  const selectedTotal = total(donuts);
  const remaining = boxSize - selectedTotal;
  const ready = remaining === 0;

  const mixError = mixAttempted ? mixMismatchMessage(remaining) : null;
  const mixHasError = Boolean(mixError);

  const contactHasError =
    contactAttempted &&
    Boolean(errors.customer?.name || errors.customer?.phone || errors.customer?.email);

  // ✅ Prefill from me (only if blank — user can still edit)
  useEffect(() => {
    if (!me) return;

    const currentName = getValues('customer.name');
    const currentEmail = getValues('customer.email');

    if (!currentName?.trim() && me.name?.trim()) {
      setValue('customer.name', me.name.trim(), { shouldDirty: false, shouldTouch: false });
    }

    if (!currentEmail?.trim() && me.email?.trim()) {
      setValue('customer.email', me.email.trim(), { shouldDirty: false, shouldTouch: false });
    }
  }, [me, getValues, setValue]);

  const orderNote = useMemo(
    () => buildOrderNote(boxSize, donuts, customer),
    [boxSize, donuts, customer]
  );

  function resetMix() {
    setValue('donuts', { chocolate: 0, glazed: 0, plain: 0 }, { shouldDirty: true });
    setMixAttempted(false);
    setStatus({ state: 'idle' });
    setManualCheckoutUrl(null);
  }

  function clampForKey(key: keyof DonutCounts, raw: unknown) {
    const nextVal = toNonNegInt(raw);
    const current = getValues('donuts');
    const currentBox = getValues('boxSize');

    const otherTotal = total(current) - current[key];
    const maxForKey = Math.max(0, currentBox - otherTotal);
    return Math.min(nextVal, maxForKey);
  }

  function axiosErrorMessage(err: unknown, fallback: string) {
    if (axios.isAxiosError(err)) {
      const msg = (err.response?.data as any)?.message || err.message || fallback;
      return String(msg);
    }
    return fallback;
  }

  async function startCheckout(values: FormValues) {
    setStatus({ state: 'idle' });
    setManualCheckoutUrl(null);

    // Must match mix exactly
    const selected = total(values.donuts);
    const remainingLocal = values.boxSize - selected;
    if (remainingLocal !== 0) return;

    setStatus({ state: 'loading' });

    try {
      const res = await backendApi.post<CheckoutResponse>('/orders/checkout', {
        boxSize: values.boxSize,
        donuts: values.donuts,
        customer: {
          name: values.customer.name.trim(),
          phone: values.customer.phone.trim(),
          email: values.customer.email.trim(),
        },
      });

      const data = res.data || {};
      const url = data.checkoutUrl;

      // If guest, keep token around for later guest flows (optional)
      if (data.guestToken && data.orderId) {
        sessionStorage.setItem(`delisey_guest_token:${data.orderId}`, data.guestToken);
      }

      if (!url) {
        setStatus({
          state: 'error',
          message: data.message || 'Checkout created but no checkoutUrl returned. Please try again.',
        });
        return;
      }

      // If backend says it couldn't store but has a link, let user proceed manually.
      if (data.ok === false) {
        setManualCheckoutUrl(url);
        setStatus({
          state: 'error',
          message:
            data.message ||
            'We created a checkout link, but could not save it to your order. Please click “Continue to payment” below.',
        });
        return;
      }

      // ✅ success: redirect
      window.location.href = url;
    } catch (err) {
      setStatus({
        state: 'error',
        message: axiosErrorMessage(err, 'Checkout failed. Please try again.'),
      });
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setMixAttempted(true);
      setContactAttempted(true);
      await startCheckout(values);
    },
    () => {
      setMixAttempted(true);
      setContactAttempted(true);
    }
  );

  const RequiredStar = () => (
    <span className="ml-1 align-super text-xs font-bold text-red-600">*</span>
  );

  if (!authChecked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-black/70">Loading…</p>
      </main>
    );
  }

  // If backend is down you can’t checkout anyway (checkout is created server-side)
  if (authError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">{authError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Order Donuts Online</h1>
      <p className="mt-1 text-sm text-black/70">
        Pick a box size (2/4/6), choose your mix, then checkout.
      </p>

      {/* Login optional */}
      <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm">
        {me ? (
          <p className="text-black/70">
            Signed in as <span className="font-semibold text-black">{me.email}</span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-black/70">
              You’re checking out as a <span className="font-semibold text-black">guest</span>.
              Login to save orders.
            </p>
            <button
              type="button"
              onClick={() => router.push('/login?next=/order')}
              className="rounded-lg border border-black/20 px-3 py-2 text-xs font-semibold"
            >
              Login / Register
            </button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* 1) Box size */}
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">1) Box size</h2>

          <Controller
            control={control}
            name="boxSize"
            render={({ field }) => (
              <div className="mt-3 flex flex-wrap gap-4">
                {BOXES.map((b) => (
                  <label key={b.size} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-4 w-4 accent-black"
                      checked={field.value === b.size}
                      onChange={() => {
                        field.onChange(b.size);
                        setValue('donuts', { chocolate: 0, glazed: 0, plain: 0 }, { shouldDirty: true });
                        setMixAttempted(false);
                        setStatus({ state: 'idle' });
                        setManualCheckoutUrl(null);
                      }}
                    />
                    <span className="text-sm">
                      Box of {b.size} <span className="text-black/60">({b.priceLabel})</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
        </section>

        {/* 2) Mix */}
        <section
          className={[
            'rounded-xl border p-4 shadow-sm',
            mixHasError ? 'border-pink-300 bg-pink-50' : 'border-black/10 bg-white',
          ].join(' ')}
        >
          <h2 className="text-base font-semibold">2) Choose your mix</h2>

          <p className="mt-2 text-sm text-black/75">
            Selected: <span className="font-semibold text-black">{selectedTotal}</span> / {boxSize}{' '}
            {remaining === 0 ? (
              <span className="text-black/70">(ready)</span>
            ) : remaining > 0 ? (
              <span className="text-black/70">
                (<span className="font-semibold text-black">{remaining}</span> remaining)
              </span>
            ) : (
              <span className="text-black/70">(too many)</span>
            )}
          </p>

          {mixHasError && <p className="mt-2 text-sm text-red-600">{mixError}</p>}

          <Controller
            control={control}
            name="donuts.chocolate"
            render={({ field }) => (
              <DonutRow
                id="donuts-chocolate"
                label="Chocolate dipped"
                value={field.value ?? 0}
                canAdd={remaining > 0}
                onChange={(v) => field.onChange(clampForKey('chocolate', v))}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />

          <Controller
            control={control}
            name="donuts.glazed"
            render={({ field }) => (
              <DonutRow
                id="donuts-glazed"
                label="Glazed"
                value={field.value ?? 0}
                canAdd={remaining > 0}
                onChange={(v) => field.onChange(clampForKey('glazed', v))}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />

          <Controller
            control={control}
            name="donuts.plain"
            render={({ field }) => (
              <DonutRow
                id="donuts-plain"
                label="Plain"
                value={field.value ?? 0}
                canAdd={remaining > 0}
                onChange={(v) => field.onChange(clampForKey('plain', v))}
                onBlur={field.onBlur}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />
        </section>

        {/* 3) Contact */}
        <section
          className={[
            'rounded-xl border p-4 shadow-sm',
            contactHasError ? 'border-pink-300 bg-pink-50' : 'border-black/10 bg-white',
          ].join(' ')}
        >
          <h2 className="text-base font-semibold">
            3) Contact <span className="font-normal text-black/60">(required)</span>
          </h2>

          {contactHasError && (
            <p className="mt-2 text-sm text-red-600">Please fill in all required contact fields.</p>
          )}

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Name <RequiredStar />
              </span>
              <input
                {...register('customer.name', {
                  validate: (v) => (v?.trim()?.length ? true : 'Name is required.'),
                })}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(errors.customer?.name)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/10"
              />
              {errors.customer?.name && (
                <p className="text-xs text-red-600">{errors.customer.name.message as string}</p>
              )}
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Phone <RequiredStar />
              </span>
              <input
                type="tel"
                {...register('customer.phone', {
                  validate: (v) => (v?.trim()?.length ? true : 'Phone is required.'),
                })}
                placeholder="555-555-5555"
                autoComplete="tel"
                aria-invalid={Boolean(errors.customer?.phone)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/10"
              />
              {errors.customer?.phone && (
                <p className="text-xs text-red-600">{errors.customer.phone.message as string}</p>
              )}
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">
                Email <RequiredStar />
              </span>
              <input
                type="email"
                {...register('customer.email', {
                  validate: (v) => (v?.trim()?.length ? true : 'Email is required.'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address.',
                  },
                })}
                placeholder="you@email.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.customer?.email)}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/10"
              />
              {errors.customer?.email && (
                <p className="text-xs text-red-600">{errors.customer.email.message as string}</p>
              )}
            </label>
          </div>
        </section>

        {/* Order note */}
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Order note</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
              onClick={async () => {
                const ok = await copyToClipboard(orderNote);
                setStatus({ state: 'info', message: ok ? 'Copied order note.' : 'Copy failed.' });
              }}
            >
              Copy note
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-black/20 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
              onClick={resetMix}
            >
              Reset mix
            </button>
          </div>

          <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-black/10 bg-black/[0.03] p-3 text-sm text-black/80">
            {orderNote}
          </pre>
        </section>

        {/* Checkout */}
        <section className="pt-1">
          <button
            type="submit"
            disabled={status.state === 'loading'}
            className="inline-flex w-full items-center justify-center rounded-xl border border-black/20 bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
          >
            {status.state === 'loading' ? 'Starting checkout…' : 'Checkout'}
          </button>

          {status.state === 'error' && <p className="mt-3 text-sm text-red-600">{status.message}</p>}
          {status.state === 'info' && <p className="mt-3 text-sm text-black/80">{status.message}</p>}

          {manualCheckoutUrl && (
            <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 text-sm">
              <div className="font-semibold">Continue to payment</div>
              <a
                className="mt-2 block break-words underline"
                href={manualCheckoutUrl}
                target="_blank"
                rel="noreferrer"
              >
                {manualCheckoutUrl}
              </a>

              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 font-semibold text-white"
                onClick={() => {
                  window.location.href = manualCheckoutUrl;
                }}
              >
                Continue to payment
              </button>
            </div>
          )}

          {!ready && status.state !== 'loading' && !mixHasError && (
            <p className="mt-2 text-xs text-black/60">
              Tip: Fill the box exactly ({boxSize} donuts total) to proceed.
            </p>
          )}
        </section>
      </form>
    </main>
  );
}

function DonutRow(props: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  canAdd: boolean;
  name?: string;
  inputRef?: (instance: HTMLInputElement | null) => void;
  onBlur?: () => void;
}) {
  const { id, label, value, onChange, canAdd, name, inputRef, onBlur } = props;

  const smallBtn =
    'inline-flex h-10 w-11 items-center justify-center rounded-lg border border-black/20 bg-white text-sm font-semibold hover:bg-black/5 disabled:opacity-50';

  return (
    <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <button
        type="button"
        className={smallBtn}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>

      <input
        id={id}
        name={name}
        ref={inputRef}
        onBlur={onBlur}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-24 rounded-lg border border-black/20 px-2 text-center text-sm outline-none focus:border-black/30 focus:ring-2 focus:ring-black/10"
      />

      <button
        type="button"
        className={smallBtn}
        onClick={() => onChange(value + 1)}
        disabled={!canAdd}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}
