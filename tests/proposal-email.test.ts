import test from 'node:test';
import assert from 'node:assert/strict';
import { proposalEmail, sendProposal } from '../lib/proposal-email';
import { initialAnswers } from '../lib/pricing';
import { POST } from '../app/api/quote/route';
const data = { answers: initialAnswers, contact: { name:'<script>alert(1)</script>', business:'Example', email:'visitor@example.com', phone:'9516041132', website:'', preferred:'Email' as const, notes:'Test & details', consent:true as const }, websiteTrap:'', idempotencyKey:'bf38246a-429f-42f0-ae83-1b151b6d89d3', startedAt:Date.now()-10000 };
test('email escapes HTML and calculates prices on the server',()=>{
 const email = proposalEmail(data,'VAA-test');
 assert.ok(!email.html.includes('<script>'));
 assert.ok(email.html.includes('&lt;script&gt;'));
 assert.match(email.text,/Setup total: \$799/);
 assert.match(email.text,/Monthly total: \$499/);
 assert.match(email.text,/visitor@example.com/);
});
test('provider uses fixed destination, reply address and stable idempotency',async()=>{
 const original=globalThis.fetch;
 const requests: RequestInit[]=[];
 globalThis.fetch=async(_url,init)=>{requests.push(init!);return Response.json({id:'email-1'});};
 try {
  const config={RESEND_API_KEY:'test-secret',LEAD_EMAIL_FROM:'sender@example.com'};
  await sendProposal(config,data,'VAA-test','stable');
  await sendProposal(config,data,'VAA-test','stable');
  assert.equal(requests[0].body,requests[1].body);
  const body=JSON.parse(requests[0].body as string);
  assert.deepEqual(body.to,['virtualagentai@gmail.com']);
  assert.equal(body.reply_to,'visitor@example.com');
  assert.equal((requests[0].headers as Record<string,string>)['Idempotency-Key'],'proposal/stable');
 } finally {globalThis.fetch=original;}
});
test('route works without D1 and does not report success on provider failure',async()=>{
 const original=globalThis.fetch;
 const old={...process.env};
 delete process.env.D1_API_TOKEN;
 process.env.RESEND_API_KEY='test-secret';process.env.LEAD_EMAIL_FROM='sender@example.com';
 const request=()=>new Request('https://example.com/api/quote',{method:'POST',headers:{origin:'https://example.com','content-type':'application/json'},body:JSON.stringify(data)});
 try {
  globalThis.fetch=async()=>Response.json({message:'private provider detail'},{status:403});
  const failed=await POST(request());assert.equal(failed.status,502);
  assert.ok(!(await failed.text()).includes('private provider detail'));
  globalThis.fetch=async()=>Response.json({id:'email-accepted'});
  const success=await POST(request());assert.equal(success.status,201);
  const ref=(await success.json()).reference;
  const retry=await POST(request());assert.equal((await retry.json()).reference,ref);
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request())).status,503);
 } finally {globalThis.fetch=original;process.env=old;}
});
