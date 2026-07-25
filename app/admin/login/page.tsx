import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That sign-in link is invalid. Request a new one below.",
  invalid_link: "That sign-in link expired or was already used. Request a new one below.",
  not_authorized: "That email isn't authorized for the Go Foreign backoffice.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-center font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
          Go Foreign
        </p>
        <h1 className="mb-8 text-center text-3xl font-black">Backoffice Sign In</h1>

        {error && ERROR_MESSAGES[error] && (
          <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {ERROR_MESSAGES[error]}
          </p>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
