import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientDetail } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Client" };
export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, appointments } = await getClientDetail(id);

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-black">{client.full_name}</h1>
      <p className="mb-1 text-gray-400">{client.email}</p>
      {client.phone && <p className="mb-8 text-gray-400">{client.phone}</p>}

      {client.notes && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Private Notes</p>
          <p className="text-sm text-gray-300">{client.notes}</p>
        </div>
      )}

      <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Appointment History</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No appointments yet.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <Link
              key={a.id}
              href={`/admin/appointments/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-4 hover:border-[#C99A2E]/40"
            >
              <div>
                <p className="font-semibold">{new Date(a.starts_at).toLocaleString()}</p>
                <p className="text-sm text-gray-500">{a.services?.name}</p>
              </div>
              <span className="text-xs uppercase text-gray-500">{a.status.replace("_", " ")}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
