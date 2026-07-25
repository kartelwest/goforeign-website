import { createServiceRoleClient } from "@/lib/supabase/server";

const MESSAGE_LIMIT_PER_MINUTE = 10;
const UPLOAD_LIMIT_PER_HOUR = 10;

export async function checkMessageRateLimit(adminId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("nunu_messages")
    .select("id", { count: "exact", head: true })
    .eq("admin_id", adminId)
    .eq("role", "user")
    .gte("created_at", since);

  return (count ?? 0) < MESSAGE_LIMIT_PER_MINUTE;
}

export async function checkUploadRateLimit(adminId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await supabase
    .from("nunu_uploads")
    .select("id", { count: "exact", head: true })
    .eq("uploaded_by", adminId)
    .gte("created_at", since);

  return (count ?? 0) < UPLOAD_LIMIT_PER_HOUR;
}
