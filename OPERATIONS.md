# Virtual Agent AI

Complete single-page marketing site with a voice studio, ten tailored industry experiences, five call-flow simulations, eleven-step quote builder, and twenty-four searchable FAQs. Existing logo downloaded from the supplied official website; no client proof or performance statistics were copied.

## Prices and calculations

Edit `lib/pricing.ts`. All amounts are integer USD cents. AI calls = ceil(incoming monthly calls × selected handling share). The resulting volume selects Essential (0–100), Professional (101–300), Advanced (301–600), or custom. Coverage never changes volume. Scheduling and CRM integration requests activate their respective add-ons through a Set, so no duplicate fee is charged. One location and English are included. Setup + first monthly subscription is the indicative activation amount.

High volume without a precise count, custom workflows, custom software, five or more locations, and regulated industries trigger review. A custom base has no fixed total. Custom workflows show a starting setup with a custom monthly amount. Known totals on other review cases are partial estimates.

## Audio

The studio now plays three supplied recordings, extracted from the user's MP4 files into mono 64 kbps MP3 files in public/audio. Video tracks and source metadata were not published. The recordings are outbound follow-up (4:39), investment inquiry (1:28), and moving services (2:15). Edit lib/scenarios.ts to replace or add recordings. They are labeled as supplied recordings for demonstration. No transcript or call outcome is invented.

The player uses real audio playback, metadata duration, seeking, playback speed, volume, and a Web Audio frequency visualization. Animation frames are canceled on pause, restart, scenario changes, and completion. Audio starts only after a visitor chooses play. Verified transcript timestamps can be added later if supplied.

## Updated interactive sections

Every industry has a different workspace illustration and tailored content. The call theater includes five separate scenario visuals, four selectable stages, and optional timed playback. The integration graph has animated SVG signal paths, moving packets, selectable nodes, and a pause control. Reduced-motion preferences disable automatic motion. The graph remains an illustrative workflow; it does not imply active integrations.

All decorative link arrows are removed. The brand includes a small AI RECEPTIONIST descriptor. Contact CTAs use tel:+19516041132.

## Sites hosting

The current project is private. `.openai/hosting.json` declares the Site ID and `DB` D1 binding. The Sites deployment applies generated schema migrations in `drizzle/`. The API never creates tables during a request. Production leads are stored server-side in `leads.payload`, with a reference, idempotency key, timestamp, hashed network identifier, and notification status. The table contains contact details, answers, quote lines, totals, and review flags. Access it using the owner's database administration tooling. No anonymous lead-reading endpoint is exposed.

Set server secrets `LEAD_WEBHOOK_URL` (HTTPS) and optional `LEAD_WEBHOOK_TOKEN` to deliver each saved proposal to an email automation, CRM, or webhook receiver. Nothing is sent to an external recipient unless configured. Without these variables, proposals remain durably stored and `notification` is `not_configured`. Failed notifications remain marked `failed` for operator retry; no background retry queue is configured. Never put secrets in frontend code. Monitor saved leads until notification delivery is configured.

POST `/api/quote` validates content type, body size, origin, schema, consent, honeypot, and form age; recalculates prices; uses a durable hourly rate limit; and prevents repeated idempotency keys. Recent identical inquiries reuse a reference. Confirmation appears only after persistence succeeds. Local browser tests confirmed stored totals of 164700 setup cents and 122600 monthly cents.

## Local development and tests

Use Node 22.13+ and install with `npm run install:ci`. Run `npm run dev`. On this workstation the default port was busy, so the preview used `node scripts/run-framework.mjs dev --port 5174`. `npm test` runs 18 pricing/schema tests. `npx tsc --noEmit` checks types. `npm run build` creates the Sites Worker build. Stop a running built-preview server before rebuilding on Windows to release file locks.

For local D1, after a build run `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_small_jamie_braddock.sql` once on a fresh local database.

## Vercel / standard Next.js

`vercel.json` selects Next.js and `npm run build:vercel`; the standard Next production build completed once. A final rerun hit Windows EPERM errors while creating generated output directories; repeat the full build on the deployment host before launch. The Vite alias selects the Cloudflare binding adapter for Sites. Standard Next uses package import `#site-env` and `lib/env-node.ts`, which accesses D1 using its documented HTTPS API. Provide `D1_ACCOUNT_ID`, `D1_DATABASE_ID`, and a scoped secret `D1_API_TOKEN`, and apply the same SQL migration to a database you control. Without them the form returns a visible storage-unavailable error rather than discarding leads. API credentials and actual Vercel deployment were not tested because none were supplied. Webhook secrets are the same on both hosts. The proposed service integrations are separate from website lead delivery and require their own voice/phone, scheduling, CRM, and SMS configuration.

D1 API reference: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/

## Before a public business launch

Supply approved production voice recordings and confirm platform/language support. Configure the business notification destination and test delivery. Confirm final pricing, service scope, privacy/retention/contract language, phone routing, and integration credentials with the business owner. The current privacy notice describes the form; it does not claim regulatory compliance. Set the final domain, canonical, Open Graph URL, sitemap, and robots values in `app/layout.tsx`, `app/sitemap.ts`, and `app/robots.ts`. The canonical currently targets the supplied business homepage; social metadata points to the private Site origin. A 1200×630 PNG social image is included. Do not claim the private deployment is publicly crawlable.

## Verification

18 engine/validation tests passed, including the supplied plumbing test. TypeScript and the final Sites production build passed. A standard Next.js production build completed once; the final rerun was blocked by Windows EPERM filesystem errors during generated output creation. Actual Vercel deployment is unverified. Browser QA walked all eleven steps, verified persistence after reload, checked pricing deduplication and itemization, saved a local proposal, changed audio scenarios, started browser narration, changed industry content, stepped the call simulator, and searched FAQs. DOM overflow measurements passed at frame widths 320, 375, 390, 430, 768, 1024, and 1440 (usable width excludes the browser scrollbar). Desktop hero and mobile layout were visually inspected. All three supplied recordings were verified in browser playback, and seeking was checked. No timestamped transcript was supplied. No production telephony or CRM connections are implied by the demos.


## Delivery status

The website is maintained in typicalsammich/ai-agent-landingpage on GitHub and deployed through its connected Vercel project. Deployment status is verified after source updates. The separate Sites project remains unused for publication.
