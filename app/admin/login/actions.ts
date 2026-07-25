"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();

export type SendMagicLinkResult = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(email: string): Promise<SendMagicLinkResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goforeign.com";
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    return { ok: false, error: "Couldn't send the link. Please try again in a moment." };
  }

  return { ok: true };
}
