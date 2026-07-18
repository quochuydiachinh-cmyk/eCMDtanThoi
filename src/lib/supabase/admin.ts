import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client dùng service role key - CHỈ dùng trong Route Handlers / script server-side.
 * Không bao giờ import file này từ Client Component.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
