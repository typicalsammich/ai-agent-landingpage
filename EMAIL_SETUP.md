# Proposal email setup

The form sends through Resend from the server. No database is required. Contact details, questionnaire answers, and a server-calculated estimate are included. Replies go to the visitor's email address. The form reports success only after Resend accepts the email.

1. Create an API key in Resend with sending permission. Save it as RESEND_API_KEY in the Vercel project's environment variables. Never commit the key.
2. Verify a domain you own in Resend by adding its DNS records. Set LEAD_EMAIL_FROM in Vercel to a sender on that verified domain, for example Virtual Agent AI <leads@your-domain.com>.
3. Set LEAD_EMAIL_TO to virtualagentai@gmail.com.
4. Apply variables to Production (and Preview if desired), then redeploy. Submit a real form and confirm receipt in Gmail and the Resend dashboard.

Resend's test sender can only send to the email address associated with your Resend account. If that account address is virtualagentai@gmail.com, you can initially use onboarding@resend.dev as LEAD_EMAIL_FROM for a test. Verify your own domain for production.

Delivery is not activated until the key and sender are configured. Missing configuration displays a helpful error and phone number. Resend acceptance does not guarantee inbox placement. Retries use stable Resend idempotency keys (24-hour provider window). Spam controls include origin checks, schema validation, a honeypot, minimum form age, and rate limiting. Without D1, rate limiting is per server instance; configure Vercel Firewall for deployment-wide protection. D1 is optional and used only for persistent rate limits; proposal storage and the former generic webhook are replaced by direct email delivery.
