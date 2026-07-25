import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "assistant";
};

// The real authorization boundary. Proxy only checks "is there a session" —
// this checks "is this session's email an active admin," and it runs again
// on every page and every server action, not just once at the edge.
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const serviceClient = createServiceRoleClient();
  const { data: adminUser } = await serviceClient
    .from("admin_users")
    .select("id, email, display_name, role, is_active")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_authorized");
  }

  return adminUser;
}
