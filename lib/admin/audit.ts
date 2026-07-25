import { createServiceRoleClient } from "@/lib/supabase/server";

export async function logAudit(params: {
  actorType: "admin" | "client" | "nunu" | "system";
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  beforeData?: unknown;
  afterData?: unknown;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("audit_log").insert({
    actor_type: params.actorType,
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    before_data: params.beforeData ?? null,
    after_data: params.afterData ?? null,
  });
}
