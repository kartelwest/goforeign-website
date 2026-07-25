import type { Metadata } from "next";
import { getRecentMessages } from "./actions";
import NuNuChat from "./NuNuChat";

export const metadata: Metadata = { title: "Nu Nu" };
export const dynamic = "force-dynamic";

export default async function NuNuPage() {
  const messages = await getRecentMessages();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Nu Nu</p>
      <h1 className="mb-8 text-3xl font-black">Your Assistant</h1>
      <NuNuChat initialMessages={messages} />
    </div>
  );
}
