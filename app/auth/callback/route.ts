import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/admin/login?error=invalid_link`);
  }

  const serviceClient = createServiceRoleClient();
  const { data: adminUser } = await serviceClient
    .from("admin_users")
    .select("id, is_active")
    .eq("email", data.user.email)
    .maybeSingle();

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=not_authorized`);
  }

  await serviceClient
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", adminUser.id);

  return NextResponse.redirect(`${origin}/admin/today`);
}
