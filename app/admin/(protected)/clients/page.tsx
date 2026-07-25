import type { Metadata } from "next";
import Link from "next/link";
import { searchClients } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await searchClients(q ?? "");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-black">Clients</h1>

      <form className="mb-8">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </form>

      {clients.length === 0 ? (
        <p className="text-gray-500">No clients found.</p>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-4 hover:border-[#C99A2E]/40"
            >
              <div>
                <p className="font-semibold">{c.full_name}</p>
                <p className="text-sm text-gray-500">{c.email}</p>
              </div>
              {c.is_blocked && (
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">Blocked</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
