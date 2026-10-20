import { z } from 'zod';
import { submissionSchema } from './validation';
import { calculate, coverageLabels, money } from './pricing';
export type EmailConfig = { RESEND_API_KEY?: string; LEAD_EMAIL_FROM?: string; LEAD_EMAIL_TO?: string };
export function proposalEmail(data: z.infer<typeof submissionSchema>, reference: string) {
 const { contact: c, answers: a } = data;
 const quote = calculate(a);
 const text = [
  `New Virtual Agent AI proposal: ${reference}`,
  `Name: ${c.name}`, `Business: ${c.business}`, `Email: ${c.email}`, `Phone: ${c.phone}`,
  `Website: ${c.website || 'Not provided'}`, `Preferred contact: ${c.preferred}`,
  `Industry: ${a.industry}`, `Incoming calls: ${a.customCalls ?? a.volume}`,
  `AI handling: ${Math.round(a.percentage * 100)}%`, `Estimated AI calls: ${quote.calls}`,
  `Coverage: ${coverageLabels[a.coverage]}`, `Locations: ${a.locations}`,
  `Languages: ${a.languages.join(', ')}`, `Integrations: ${a.integrations.join(', ') || 'None'}`,
  '', 'Estimate (USD, subject to scope confirmation):',
  ...quote.lines.map(line => `${line.label}: setup ${money(line.setup)}, monthly ${money(line.monthly)}`),
  `Setup total: ${money(quote.setup)}`, `Monthly total: ${money(quote.monthly)}`,
  `Activation estimate: ${money(quote.activation)}`,
  `Call volume provisional: ${quote.provisional ? 'Yes' : 'No'}`,
  `Review: ${quote.flags.join('; ') || 'Standard scope'}`,
  '', `Notes: ${c.notes || 'None'}`, 'Contact consent: confirmed',
 ].join('\n');
 const escaped = text.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));
 return { subject: 'New Virtual Agent AI proposal request', text, html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6">${escaped}</div>` };
}
export async function sendProposal(config: EmailConfig, data: z.infer<typeof submissionSchema>, reference: string, key: string) {
 if (!config.RESEND_API_KEY || !config.LEAD_EMAIL_FROM) throw new Error('Email is not configured');
 const response = await fetch('https://api.resend.com/emails', {
  method: 'POST', headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `proposal/${key}` },
  body: JSON.stringify({ from: config.LEAD_EMAIL_FROM, to: [config.LEAD_EMAIL_TO || 'virtualagentai@gmail.com'], reply_to: data.contact.email, ...proposalEmail(data, reference) }),
  signal: AbortSignal.timeout(15000),
 });
 if (!response.ok) throw new Error('Email provider rejected the request');
 const body = await response.json() as { id?: string };
 if (!body.id) throw new Error('Email acceptance was not confirmed');
 return body.id;
}
