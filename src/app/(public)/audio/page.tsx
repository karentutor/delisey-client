"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { backendApi } from "../../../lib/backendApi";
import { useAuth } from "../../../context/AuthContext";

type BoxSize = 1 | 4 | 6;

type DonutCounts = {
  chocolate: number; // label: Chocolate glaze
  glazed: number;    // label: Plain glaze
  plain: number;     // label: Cinnamon balls (we reuse "plain" field)
};

type Customer = { name: string; phone: string; email: string };

type CheckoutResponse = {
  ok: boolean;
  orderId?: string;
  status?: string;
  checkoutUrl?: string;
  guestToken?: string;
  message?: string;
};

function clampInt(v: unknown) {
  const n = typeof v === "number" ? v : Number.parseInt(String(v ?? "0"), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function total(d: DonutCounts) {
  return (d.chocolate || 0) + (d.glazed || 0) + (d.plain || 0);
}

export default function AudioKioskPage() {
  const router = useRouter();
  const { me, authChecked, authError } = useAuth();

  // wizard steps
  const [step, setStep] = useState<"intro" | "size" | "flavors" | "contact" | "review">("intro");

  const [boxSize, setBoxSize] = useState<BoxSize>(4);
  const [donuts, setDonuts] = useState<DonutCounts>({ chocolate: 0, glazed: 0, plain: 0 });
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" });

  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "error"; message: string }
    | { state: "info"; message: string }
  >({ state: "idle" });

  const [manualCheckoutUrl, setManualCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
  if (!authChecked) return;
  if (authError) return; // backend down -> don't redirect

  // must be logged in
  if (!me) {
    router.replace('/login?next=/audio');
    return;
  }

  // must be admin
  if ((me as any).role !== 'admin') {
    router.replace('/'); // or '/orders'
  }
}, [authChecked, authError, me, router]);

if (!authChecked) return <main className="...">Loading…</main>;
if (authError) return <main className="...">{authError}</main>;

if (!me) return <main className="...">Redirecting to login…</main>;

if ((me as any).role !== 'admin') {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold">Not allowed</h1>
      <p className="mt-2 text-sm text-black/70">This page is for admins only.</p>
    </main>
  );
}



  // mic animation (optional)
  const [micOn, setMicOn] = useState(false);
  const [level, setLevel] = useState(0); // 0..1
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

  // optional recording for replay (not used for parsing)
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const selectedTotal = total(donuts);
  const remaining = boxSize - selectedTotal;

  const canContinueFlavors = remaining === 0 && selectedTotal === boxSize;
  const canCheckout =
    canContinueFlavors &&
    customer.name.trim().length > 0 &&
    customer.phone.trim().length > 0 &&
    customer.email.trim().length > 0;

  // Prefill from logged-in user if empty (optional)
  useEffect(() => {
    if (!me) return;
    setCustomer((c) => ({
      name: c.name.trim() ? c.name : (me.name || "").trim(),
      phone: c.phone,
      email: c.email.trim() ? c.email : (me.email || "").trim(),
    }));
  }, [me]);

  function stopMic() {
    setMicOn(false);
    setLevel(0);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;

    try {
      audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;

    try {
      const s = streamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    // stop recorder if running
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {}
    }
    recorderRef.current = null;
  }

  async function startMic() {
    setStatus({ state: "idle" });
    setManualCheckoutUrl(null);
    setAudioUrl(null);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextCtor();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    source.connect(analyser);

const data = new Uint8Array(new ArrayBuffer(analyser.fftSize));
dataRef.current = data;


    const tick = () => {
      const a = analyserRef.current;
      const buf = dataRef.current;
      if (!a || !buf) return;

      a.getByteTimeDomainData(buf);

      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buf.length);
      setLevel(Math.min(1, rms * 2.2));

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    // Optional recording (if supported)
    if (typeof MediaRecorder !== "undefined") {
      try {
        const rec = new MediaRecorder(stream);
        recorderRef.current = rec;
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        };
        rec.start();
      } catch {
        // ignore recorder failures; mic animation still works
      }
    }

    setMicOn(true);
  }

  function setFlavor(key: keyof DonutCounts, nextVal: number) {
    setDonuts((d) => {
      const next = { ...d, [key]: clampInt(nextVal) };
      // enforce not exceeding box size
      const sum = total(next);
      if (sum <= boxSize) return next;
      return d;
    });
  }

  function inc(key: keyof DonutCounts) {
    if (remaining <= 0) return;
    setFlavor(key, donuts[key] + 1);
  }

  function dec(key: keyof DonutCounts) {
    setFlavor(key, Math.max(0, donuts[key] - 1));
  }

  function resetAll() {
    stopMic();
    setStep("intro");
    setBoxSize(4);
    setDonuts({ chocolate: 0, glazed: 0, plain: 0 });
    setCustomer({ name: "", phone: "", email: "" });
    setStatus({ state: "idle" });
    setManualCheckoutUrl(null);
    setAudioUrl(null);
  }

  async function approveAndCheckout() {
    setStatus({ state: "loading" });
    setManualCheckoutUrl(null);

    try {
      const res = await backendApi.post<CheckoutResponse>("/orders/checkout", {
        boxSize,
        donuts,
        customer,
      });

      const data = res.data || {};
      const url = data.checkoutUrl;

      if (data.guestToken && data.orderId) {
        sessionStorage.setItem(`delisey_guest_token:${data.orderId}`, data.guestToken);
      }

      if (!url) {
        setStatus({ state: "error", message: data.message || "No checkoutUrl returned." });
        return;
      }

      if (data.ok === false) {
        setManualCheckoutUrl(url);
        setStatus({
          state: "error",
          message:
            data.message ||
            "Checkout link created but could not be stored. Use “Continue to payment”.",
        });
        return;
      }

      window.location.href = url;
    } catch (e: any) {
      setStatus({
        state: "error",
        message: e?.response?.data?.message || e?.message || "Checkout failed.",
      });
    }
  }

  const circleScale = 1 + level * 0.6;

  if (!authChecked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-black/70">Loading…</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-red-600">{authError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Audio Kiosk</h1>
        <button
          type="button"
          onClick={() => router.push("/order")}
          className="rounded-lg border border-black/20 px-3 py-2 text-xs font-semibold"
        >
          Back to /order
        </button>
      </div>

      <p className="mt-2 text-sm text-black/70">
        Simple guided flow (no speech-to-text). Optional mic animation for the “cool” listening vibe.
      </p>

      <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm">
        {me ? (
          <p className="text-black/70">
            Logged in as <span className="font-semibold text-black">{me.email}</span>
          </p>
        ) : (
          <p className="text-black/70">
            Checkout as <span className="font-semibold text-black">guest</span>.
          </p>
        )}
      </div>

      {/* Listening circle */}
      <div className="mt-6 flex flex-col items-center justify-center gap-4">
        <div
          className="h-44 w-44 rounded-full bg-black"
          style={{
            transform: `scale(${circleScale})`,
            transition: "transform 60ms linear",
            boxShadow: micOn ? "0 0 0 12px rgba(0,0,0,0.06)" : "none",
          }}
        />

        <div className="flex flex-wrap gap-3">
          {!micOn ? (
            <button
              type="button"
              onClick={() =>
                startMic().catch((e) =>
                  setStatus({ state: "error", message: e?.message || "Mic permission failed." })
                )
              }
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white"
            >
              Start listening
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopMic()}
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white"
            >
              Stop listening
            </button>
          )}

          <button
            type="button"
            onClick={resetAll}
            className="rounded-xl border border-black/20 bg-white px-6 py-3 text-sm font-semibold"
          >
            Reset
          </button>
        </div>

        {audioUrl && (
          <div className="w-full rounded-xl border border-black/10 bg-white p-3">
            <div className="text-sm font-semibold">Recording (optional)</div>
            <audio className="mt-2 w-full" controls src={audioUrl} />
          </div>
        )}
      </div>

      {/* Wizard */}
      <div className="mt-6 rounded-xl border border-black/10 bg-white p-5">
        {step === "intro" && (
          <>
            <div className="text-lg font-semibold">What would you like to order?</div>
            <p className="mt-2 text-sm text-black/70">
              Tap continue to choose box size.
            </p>

            <button
              type="button"
              onClick={() => setStep("size")}
              className="mt-4 w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </>
        )}

        {step === "size" && (
          <>
            <div className="text-lg font-semibold">Choose size</div>
            <p className="mt-2 text-sm text-black/70">1 donut, 4 donuts, or 6 donuts.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                { size: 1 as BoxSize, label: "1 donut", price: "$1 (test)" },
                { size: 4 as BoxSize, label: "4 donuts", price: "$12" },
                { size: 6 as BoxSize, label: "6 donuts", price: "$18" },
              ] as const).map((b) => (
                <button
                  key={b.size}
                  type="button"
                  onClick={() => {
                    setBoxSize(b.size);
                    setDonuts({ chocolate: 0, glazed: 0, plain: 0 });
                    setStep("flavors");
                  }}
                  className="rounded-xl border border-black/20 bg-white px-5 py-4 text-left hover:bg-black/5"
                >
                  <div className="text-base font-semibold">{b.label}</div>
                  <div className="text-sm text-black/60">{b.price}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>
            </div>
          </>
        )}

        {step === "flavors" && (
          <>
            <div className="text-lg font-semibold">Choose flavors</div>
            <p className="mt-2 text-sm text-black/70">
              Total must equal <span className="font-semibold text-black">{boxSize}</span>.
            </p>

            <div className="mt-3 text-sm">
              Selected: <span className="font-semibold">{selectedTotal}</span> / {boxSize}{" "}
              {remaining === 0 ? (
                <span className="text-black/60">(ready)</span>
              ) : remaining > 0 ? (
                <span className="text-black/60">({remaining} remaining)</span>
              ) : (
                <span className="text-red-600">(too many)</span>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              {[
                { key: "chocolate" as const, label: "Chocolate glaze" },
                { key: "glazed" as const, label: "Plain glaze" },
                { key: "plain" as const, label: "Cinnamon balls" }, // ✅ reusing "plain"
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                  <div className="font-semibold">{row.label}</div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => dec(row.key)}
                      disabled={donuts[row.key] <= 0}
                      className="h-10 w-10 rounded-lg border border-black/20 font-bold disabled:opacity-50"
                    >
                      −
                    </button>

                    <div className="w-12 text-center text-lg font-semibold">{donuts[row.key]}</div>

                    <button
                      type="button"
                      onClick={() => inc(row.key)}
                      disabled={remaining <= 0}
                      className="h-10 w-10 rounded-lg border border-black/20 font-bold disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("size")}
                className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!canContinueFlavors}
                onClick={() => setStep("contact")}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "contact" && (
          <>
            <div className="text-lg font-semibold">Contact</div>
            <p className="mt-2 text-sm text-black/70">Name, phone, and email are required.</p>

            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-lg border border-black/20 px-3 py-2"
                placeholder="Name"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-black/20 px-3 py-2"
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-black/20 px-3 py-2"
                placeholder="Email"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("flavors")}
                className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setStep("review")}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <div className="text-lg font-semibold">Review & approve</div>

            <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.03] p-3 text-sm">
              <div><span className="font-semibold">Size:</span> {boxSize}</div>
              <div className="mt-1">
                <span className="font-semibold">Flavors:</span>{" "}
                {donuts.chocolate} chocolate, {donuts.glazed} plain glaze, {donuts.plain} cinnamon balls
              </div>
              <div className="mt-1">
                <span className="font-semibold">Customer:</span> {customer.name} · {customer.phone} · {customer.email}
              </div>
            </div>

            {status.state === "error" && (
              <p className="mt-3 text-sm text-red-600">{status.message}</p>
            )}
            {status.state === "info" && (
              <p className="mt-3 text-sm text-black/80">{status.message}</p>
            )}

            {manualCheckoutUrl && (
              <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 text-sm">
                <div className="font-semibold">Continue to payment</div>
                <a className="mt-2 block break-words underline" href={manualCheckoutUrl} target="_blank" rel="noreferrer">
                  {manualCheckoutUrl}
                </a>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 font-semibold text-white"
                  onClick={() => (window.location.href = manualCheckoutUrl)}
                >
                  Continue to payment
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("contact")}
                className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!canCheckout || status.state === "loading"}
                onClick={approveAndCheckout}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {status.state === "loading" ? "Starting checkout…" : "Approve & Checkout"}
              </button>
            </div>

            {!canCheckout && (
              <p className="mt-2 text-xs text-black/60">
                Make sure flavors total {boxSize}, and name/phone/email are filled.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
