declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    SUPABASE_CATALOG_URL?: string;
    SUPABASE_CATALOG_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
