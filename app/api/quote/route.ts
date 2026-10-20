import { getEnvironment } from '#site-env';
import { submissionSchema } from '@/lib/validation';
import { sendProposal, type EmailConfig } from '@/lib/proposal-email';
const digest = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(b => b.toString(16).padStart(2, '0')).join('');
// Best-effort per-instance protection without D1. Use Vercel Firewall for deployment-wide limits.
const buckets = new Map<string, { count: number; expires: number }>();
export async function POST(request: Request) {
 const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
 try {
  const env = getEnvironment();
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Please submit from this website.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'JSON required.' }, 415);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 16000) return json({ error: 'Submission is too large.' }, 413);
  let input: unknown; try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid submission.' }, 400); }
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return json({ error: 'Check your contact details and questionnaire answers.' }, 400);
  const data = parsed.data;
  if (Date.now() - data.startedAt < 3000 || data.startedAt > Date.now()) return json({ error: 'Please review your details before submitting.' }, 400);
  const config = env as EmailConfig;
  if (!config.RESEND_API_KEY || !config.LEAD_EMAIL_FROM) return json({ error: 'Email delivery is being configured. Please call (951) 604-1132.' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const ipHash = await digest(ip + ':' + Math.floor(Date.now() / 86400000));
  const bucket = `${ipHash}:${Math.floor(Date.now() / 3600000)}`;
  for (const [key, value] of buckets) if (value.expires < Date.now()) buckets.delete(key);
  if (!buckets.has(bucket) && buckets.size >= 10000) return json({ error: 'Please try again shortly.' }, 429);
  const local = buckets.get(bucket) || { count: 0, expires: Date.now() + 3600000 };
  local.count++; buckets.set(bucket, local);
  let count = local.count;
  if (env.DB) {
   try {
    const rate = await env.DB.prepare('INSERT INTO rate_limits (id, count) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count').bind(bucket).first<{count:number}>();
    count = Math.max(count, rate?.count ?? count);
   } catch { /* Email delivery remains available if optional storage is unavailable. */ }
  }
  if (count > 5) return json({ error: 'Too many requests. Please try again in an hour or call (951) 604-1132.' }, 429);
  // Stable content-derived keys prevent retries from sending duplicate emails or conflicting with edited details.
  const fingerprint = await digest(JSON.stringify([data.idempotencyKey, data.contact, data.answers]));
  const reference = 'VAA-' + fingerprint.slice(0, 24);
  try { await sendProposal(config, data, reference, fingerprint); }
  catch { return json({ error: 'Your request could not be emailed. Your answers are preserved; please retry or call (951) 604-1132.' }, 502); }
  return json({ reference }, 201);
 } catch { return json({ error: 'We could not complete your request. Your answers are preserved; please try again.' }, 500); }
}
