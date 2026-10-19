// Vercel/Node adapter. Secrets stay on the server; use a scoped D1 API token.
export function getEnvironment(): { DB?: D1Database; LEAD_WEBHOOK_URL?: string; LEAD_WEBHOOK_TOKEN?: string } {
 const { D1_ACCOUNT_ID, D1_DATABASE_ID, D1_API_TOKEN, LEAD_WEBHOOK_URL, LEAD_WEBHOOK_TOKEN } = process.env;
 if (!D1_ACCOUNT_ID || !D1_DATABASE_ID || !D1_API_TOKEN) return { LEAD_WEBHOOK_URL, LEAD_WEBHOOK_TOKEN };
 const prepare = (sql: string, params: unknown[] = []) => ({
  bind: (...values: unknown[]) => prepare(sql, values),
  async run() {
   const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(D1_ACCOUNT_ID)}/d1/database/${encodeURIComponent(D1_DATABASE_ID)}/query`, { method: 'POST', headers: { Authorization: `Bearer ${D1_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }), cache:'no-store', signal:AbortSignal.timeout(15000) });
   const body = await response.json() as { success: boolean; result?: { success: boolean; results: unknown[] }[] };
   if (!response.ok || !body.success || !body.result?.[0]?.success) throw new Error('Database operation failed');
   return body.result[0];
  },
  async first<T>() { const result = await this.run(); return (result.results[0] ?? null) as T | null; },
 });
 return { DB: { prepare } as unknown as D1Database, LEAD_WEBHOOK_URL, LEAD_WEBHOOK_TOKEN };
}
