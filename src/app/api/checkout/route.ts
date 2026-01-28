//client/src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

type BoxSize = 2 | 4 | 6;

type DonutCounts = {
  chocolate: number;
  glazed: number;
  plain: number;
};

type Body = {
  boxSize: BoxSize;
  donuts: DonutCounts;
  customer?: { name?: string; phone?: string; email?: string };

  // Optional: you can pass your Mongo orderId if you ever want it here later
  // mongoOrderId?: string;
};

const DEFAULT_AMOUNT_CENTS: Record<BoxSize, number> = {
  2: 700,
  4: 1200,
  6: 1800,
};

function isNonNegInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

function normalizeCurrency(input: string | undefined): string {
  const c = (input ?? '').trim().toUpperCase();
  return c || 'CAD';
}

function parseAmountCents(boxSize: BoxSize): number {
  const raw =
    boxSize === 2
      ? process.env.SQUARE_BOX2_AMOUNT
      : boxSize === 4
        ? process.env.SQUARE_BOX4_AMOUNT
        : process.env.SQUARE_BOX6_AMOUNT;

  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isFinite(parsed)) return parsed;

  return DEFAULT_AMOUNT_CENTS[boxSize];
}

export async function POST(req: Request) {
  // --- Parse request body ---
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // --- Validate inputs ---
  if (body.boxSize !== 2 && body.boxSize !== 4 && body.boxSize !== 6) {
    return NextResponse.json({ error: 'boxSize must be 2, 4, or 6.' }, { status: 400 });
  }

  const d = body.donuts;
  if (!d || !isNonNegInt(d.chocolate) || !isNonNegInt(d.glazed) || !isNonNegInt(d.plain)) {
    return NextResponse.json({ error: 'Invalid donut counts.' }, { status: 400 });
  }

  const sum = d.chocolate + d.glazed + d.plain;
  if (sum !== body.boxSize) {
    return NextResponse.json(
      { error: `Donut counts must add up to ${body.boxSize}. Got ${sum}.` },
      { status: 400 }
    );
  }

  // --- Environment variables ---
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!accessToken || !locationId) {
    return NextResponse.json(
      {
        error: 'Missing Square server config.',
        required: ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID'],
      },
      { status: 500 }
    );
  }

  const envRaw = (process.env.SQUARE_ENVIRONMENT ?? 'sandbox').toLowerCase();
  const environment = envRaw === 'production' ? 'production' : 'sandbox';

  const baseUrl =
    environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

  const squareVersion = process.env.SQUARE_VERSION ?? '2025-10-16';
  const currency = normalizeCurrency(process.env.SQUARE_CURRENCY);
  const amountCents = parseAmountCents(body.boxSize);

  // --- Build note ---
  const donutNote = `Donut mix: ${d.chocolate} chocolate dipped, ${d.glazed} glazed, ${d.plain} plain`;

  const customerParts: string[] = [];
  if (body.customer?.name) customerParts.push(`Name: ${body.customer.name}`);
  if (body.customer?.phone) customerParts.push(`Phone: ${body.customer.phone}`);
  if (body.customer?.email) customerParts.push(`Email: ${body.customer.email}`);
  const fullNote = customerParts.length ? `${donutNote} | ${customerParts.join(' | ')}` : donutNote;

  // --- Square CreatePaymentLink payload ---
  const payload = {
    idempotency_key: randomUUID(),
    order: {
      location_id: locationId,
      note: fullNote,
      line_items: [
        {
          name: `Donut Box (${body.boxSize})`,
          quantity: '1',
          base_price_money: { amount: amountCents, currency },
          note: donutNote,
        },
      ],
    },
  };

  const url = `${baseUrl}/v2/online-checkout/payment-links`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Square-Version': squareVersion,
  };

  // --- Call Square ---
  let squareRes: Response;
  try {
    squareRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach Square API.' }, { status: 502 });
  }

  const raw = await squareRes.text().catch(() => '');
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!squareRes.ok) {
    return NextResponse.json(
      {
        error: 'Square API error creating payment link.',
        square_status: squareRes.status,
        square_body: data ?? raw,
      },
      { status: 502 }
    );
  }

  // ✅ Extract fields from Square response
  const paymentLink = data?.payment_link;
  const checkoutUrl = paymentLink?.url;
  const longUrl = paymentLink?.long_url;
  const checkoutId = paymentLink?.id; // payment link id
  const squareOrderId = paymentLink?.order_id; // order id created by checkout

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: 'Square response missing payment_link.url.', square_body: data ?? raw },
      { status: 502 }
    );
  }

  // ✅ Return everything your client needs to store in Mongo
  return NextResponse.json({
    url: checkoutUrl,
    longUrl,
    checkoutId,
    squareOrderId,
    locationId,
    environment,
  });
}
