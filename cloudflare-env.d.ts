declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RESEND_API_KEY?: string;
    LEAD_EMAIL_FROM?: string;
    LEAD_EMAIL_TO?: string;
    BUCKET?: R2Bucket;
  }
}

