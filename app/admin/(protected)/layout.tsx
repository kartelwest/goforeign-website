import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Go Foreign Admin" },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminNav displayName={admin.display_name ?? admin.email} />
      <main className="px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
