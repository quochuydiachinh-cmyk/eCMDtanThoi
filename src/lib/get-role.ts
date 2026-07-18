import { createClient } from "@/lib/supabase/server";
import { Role } from "@/lib/role";

/** Server-side: lấy role của người đang đăng nhập. null nếu chưa đăng nhập. */
export async function getCurrentUserRole(): Promise<Role | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (data?.role as Role | undefined) ?? "viewer";
}
