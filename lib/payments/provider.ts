import type { PaymentMethod, PaymentStatus } from "@/lib/supabase/types";

export type RecordPaymentInput = {
  appointmentId: string;
  clientId: string;
  amountCents: number;
  method: PaymentMethod;
  reference?: string | null;
  receivedAt?: Date;
  notes?: string | null;
  recordedByAdminId: string;
};

export type RecordedPayment = {
  id: string;
  appointmentId: string | null;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  receivedAt: string;
};

// Swap in a StripeProvider (or similar) later without touching the booking
// flow or the backoffice UI — both only ever talk to this interface.
export interface PaymentProvider {
  readonly name: string;
  recordPayment(input: RecordPaymentInput): Promise<RecordedPayment>;
  setAppointmentPaymentStatus(appointmentId: string, status: PaymentStatus): Promise<void>;
}
