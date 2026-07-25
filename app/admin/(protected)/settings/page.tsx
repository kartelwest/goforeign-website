import type { Metadata } from "next";
import { getAllServices } from "@/lib/admin/data";
import { getPaymentsSettings } from "@/lib/booking/data";
import SettingsEditor from "./SettingsEditor";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [services, payments] = await Promise.all([getAllServices(), getPaymentsSettings()]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-black">Settings</h1>
      <SettingsEditor initialServices={services} initialPaymentsSettings={payments} />
    </div>
  );
}
