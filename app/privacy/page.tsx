import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Go Foreign's privacy policy covering how we collect, use, and protect your information.",
  alternates: { canonical: "/privacy" },
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Legal</p>
        <h1 className="mb-4 text-4xl font-black md:text-5xl">Privacy Policy</h1>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: placeholder — this draft has not been reviewed by an attorney. Do not
          rely on it in production before legal review.
        </p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Information We Collect</h2>
            <p>
              When you book a consultation or contact Go Foreign, we collect the information you
              provide directly: your name, email address, phone number, timezone, and any details
              you share about what you&apos;d like to cover in your session.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">How We Use Your Information</h2>
            <p>
              We use this information to schedule and manage your consultation, communicate with
              you about your appointment, and improve our services. We do not sell your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Data Storage &amp; Security</h2>
            <p>
              Appointment and contact information is stored securely and access is restricted to
              Go Foreign staff who need it to serve you.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information
              at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Contact Us</h2>
            <p>
              Questions about this policy can be directed to Go Foreign through the contact
              methods listed on our site.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
