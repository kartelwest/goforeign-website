import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/supabase/types";
import type { PaymentProvider, RecordPaymentInput, RecordedPayment } from "./provider";

// Zelle/CashApp/cash/check — recorded by hand in the backoffice after the
// money actually moves. No checkout, no webhooks; a human is the source of
// truth. See PAYMENTS.md for why this is the right starting point.
export class ManualProvider implements PaymentProvider {
  readonly name = "manual";

  async recordPayment(input: RecordPaymentInput): Promise<RecordedPayment> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        appointment_id: input.appointmentId,
        client_id: input.clientId,
        amount_cents: input.amountCents,
        method: input.method,
        status: "paid",
        reference: input.reference ?? null,
        received_at: (input.receivedAt ?? new Date()).toISOString(),
        recorded_by: input.recordedByAdminId,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    await this.setAppointmentPaymentStatus(input.appointmentId, "paid");

    return {
      id: data.id,
      appointmentId: data.appointment_id,
      amountCents: data.amount_cents,
      method: data.method,
      status: data.status,
      receivedAt: data.received_at,
    };
  }

  async setAppointmentPaymentStatus(appointmentId: string, status: PaymentStatus): Promise<void> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("appointments")
      .update({ payment_status: status })
      .eq("id", appointmentId);

    if (error) throw error;
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new ManualProvider();
}
