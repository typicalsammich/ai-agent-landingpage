import { getEnvironment } from '#site-env';
import { submissionSchema } from '@/lib/validation';
import { calculate } from '@/lib/pricing';
const digest = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(b => b.toString(16).padStart(2, '0')).join('');
export async function POST(request: Request) {
 const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
 try {
  const env = getEnvironment();
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Please submit from this website.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'JSON required.' }, 415);
  const raw = await request.text(); if (new TextEncoder().encode(raw).length > 16000) return json({ error: 'Submission is too large.' }, 413);
  const parsed = submissionSchema.safeParse(JSON.parse(raw)); if (!parsed.success) return json({ error: 'Check your contact details and questionnaire answers.' }, 400);
  const data = parsed.data;
  if (Date.now() - data.startedAt < 3000 || data.startedAt > Date.now()) return json({ error: 'Please review your details before submitting.' }, 400);
  const db = env.DB; if (!db) return json({ error: 'Proposal storage is unavailable. Please try again later or contact virtualagentai@gmail.com.' }, 503);
  const existing = await db.prepare('SELECT id FROM leads WHERE idempotency_key = ?').bind(data.idempotencyKey).first<{id:string}>(); if (existing) return json({ reference: existing.id });
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const ipHash = await digest(ip + ':' + Math.floor(Date.now() / 86400000));
  const bucket = `${ipHash}:${Math.floor(Date.now() / 3600000)}`;
  const rate = await db.prepare('INSERT INTO rate_limits (id, count) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count').bind(bucket).first<{count:number}>();
  if ((rate?.count ?? 99) > 5) return json({ error: 'Too many requests. Please try again in an hour.' }, 429);
  const quote = calculate(data.answers); const fingerprint = await digest(JSON.stringify([data.contact.email.toLowerCase(), data.answers]));
  const duplicate = await db.prepare('SELECT id FROM leads WHERE fingerprint = ? AND created_at > ?').bind(fingerprint, Date.now() - 86400000).first<{id:string}>(); if (duplicate) return json({ reference: duplicate.id });
  const reference = 'VAA-' + crypto.randomUUID();
  const payload = { contact: data.contact, answers: data.answers, quote, reference, timestamp: new Date().toISOString() };
  await db.prepare('INSERT INTO leads (id, idempotency_key, fingerprint, ip_hash, payload, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING').bind(reference, data.idempotencyKey, fingerprint, ipHash, JSON.stringify(payload), Date.now()).run();
  const persisted = await db.prepare('SELECT id FROM leads WHERE idempotency_key = ?').bind(data.idempotencyKey).first<{id:string}>();
  if (!persisted) throw new Error('Persistence not confirmed');
  if (persisted.id !== reference) return json({ reference: persisted.id });
  const config = env as unknown as Record<string, string | undefined>;
  if (config.LEAD_WEBHOOK_URL) {
   try { if (!config.LEAD_WEBHOOK_URL.startsWith('https://')) throw new Error('HTTPS required');
    const result = await fetch(config.LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(config.LEAD_WEBHOOK_TOKEN ? { Authorization: `Bearer ${config.LEAD_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
    await db.prepare('UPDATE leads SET notification = ? WHERE id = ?').bind(result.ok ? 'delivered' : 'failed', reference).run();
   } catch { await db.prepare('UPDATE leads SET notification = ? WHERE id = ?').bind('failed', reference).run(); }
  }
  return json({ reference }, 201);
 } catch { return json({ error: 'We could not complete your request. Your answers are preserved; please try again.' }, 500); }
}
