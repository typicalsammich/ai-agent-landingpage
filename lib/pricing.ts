export const pricing = {
 bands: { essential: { setup: 79900, monthly: 49900, maxCalls: 100 }, professional: { setup: 129900, monthly: 89900, maxCalls: 300 }, advanced: { setup: 199900, monthly: 149900, maxCalls: 600 } },
 coverage: { businessHours: 0, afterHours: 4900, eveningsWeekends: 9900, alwaysAvailable: 14900 },
 addons: { scheduling: { label: 'Appointment scheduling', setup: 19900, monthly: 9900 }, smsFollowUp: { label: 'SMS follow-up', setup: 14900, monthly: 7900 }, crmIntegration: { label: 'CRM integration', setup: 34900, monthly: 14900 }, advancedRouting: { label: 'Advanced call routing', setup: 24900, monthly: 9900 }, outboundFollowUp: { label: 'Outbound AI lead follow-up', setup: 59900, monthly: 29900 }, customWorkflow: { label: 'Custom workflows', setup: 59900, monthly: 0 } },
 location: { setup: 39900, monthly: 24900 }, language: { setup: 19900, monthly: 9900 },
};
export type Answers = { industry: string; volume: string; customCalls: number | null; percentage: number; coverage: keyof typeof pricing.coverage; addons: (keyof typeof pricing.addons)[]; locations: number; languages: string[]; integrations: string[] };
export const initialAnswers: Answers = { industry: 'Plumbing', volume: '50–100', customCalls: null, percentage: 1, coverage: 'businessHours', addons: [], locations: 1, languages: ['English'], integrations: [] };
export const volumes: Record<string, number> = { 'Fewer than 50': 35, '50–100': 75, '101–200': 150, '201–300': 250, '301–450': 375, '451–600': 525, 'More than 600': 601, "I'm not sure": 100 };
export const coverageLabels = { businessHours: 'Business hours', afterHours: 'After hours', eveningsWeekends: 'Evenings & weekends', alwaysAvailable: '24/7 coverage' };
export const money = (cents: number | null) => cents === null ? 'Custom quote' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
export function determineBand(calls: number) { return calls <= 100 ? 'essential' : calls <= 300 ? 'professional' : calls <= 600 ? 'advanced' : 'custom'; }
export function calculate(a: Answers) {
 const incoming = a.customCalls ?? volumes[a.volume]; const calls = Math.ceil(incoming * a.percentage);
 const band = a.volume === 'More than 600' && a.customCalls === null ? 'custom' : determineBand(calls);
 const flags: string[] = [];
 if (band === 'custom') flags.push('Call volume requires a custom quote');
 if (a.locations >= 5) flags.push('Five or more locations require review');
 if (a.integrations.includes('Custom business software')) flags.push('Custom integration compatibility review');
 if (a.addons.includes('customWorkflow')) flags.push('Custom workflow scope and monthly fee require review');
 if (['Medical', 'Dental', 'Legal'].includes(a.industry)) flags.push('Regulated-industry workflow review');
 const features = new Set(a.addons);
 if (a.integrations.some(i => ['Google Calendar', 'Calendly'].includes(i))) features.add('scheduling');
 if (a.integrations.includes('CRM software')) features.add('crmIntegration');
 const base = band === 'custom' ? null : pricing.bands[band];
 const lines = [{ label: `${band === 'custom' ? 'Custom' : band[0].toUpperCase() + band.slice(1)} base`, setup: base?.setup ?? null, monthly: base?.monthly ?? null }, { label: coverageLabels[a.coverage], setup: 0, monthly: pricing.coverage[a.coverage] }, ...[...features].map(k => ({ label: pricing.addons[k].label, setup: pricing.addons[k].setup, monthly: k === 'customWorkflow' ? null : pricing.addons[k].monthly })), { label: `Additional locations (${a.locations - 1})`, setup: (a.locations - 1) * pricing.location.setup, monthly: (a.locations - 1) * pricing.location.monthly }, { label: 'Additional languages', setup: [...new Set(a.languages)].filter(x => x !== 'English').length * pricing.language.setup, monthly: [...new Set(a.languages)].filter(x => x !== 'English').length * pricing.language.monthly }];
 const setup = base ? lines.reduce((s, l) => s + (l.setup ?? 0), 0) : null;
 const monthly = base && !features.has('customWorkflow') ? lines.reduce((s, l) => s + (l.monthly ?? 0), 0) : null;
 return { incoming, calls, band, features: [...features], lines, setup, monthly, activation: setup !== null && monthly !== null ? setup + monthly : null, flags, provisional: a.customCalls === null, review: flags.length > 0 };
}
