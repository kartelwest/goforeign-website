import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Go Foreign's terms of service governing use of our website and consulting services.",
  alternates: { canonical: "/terms" },
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Legal</p>
        <h1 className="mb-4 text-4xl font-black md:text-5xl">Terms of Service</h1>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: placeholder — this draft has not been reviewed by an attorney. Do not
          rely on it in production before legal review.
        </p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Services</h2>
            <p>
              Go Foreign provides lifestyle management consulting, including relocation planning,
              marketing and branding support, housing assistance, visa guidance, business setup
              support, and local connections in Brazil. Consultations booked through this site are
              informational and advisory in nature.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Booking &amp; Cancellations</h2>
            <p>
              Booking a consultation does not require payment. Payment methods and rates are
              discussed and confirmed directly with you after your consultation is scheduled.
              Cancellation and rescheduling policies are provided in your confirmation email.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">No Guarantee of Outcome</h2>
            <p>
              Go Foreign provides guidance and support but does not guarantee any specific
              relocation, visa, business, or lifestyle outcome. Immigration and business
              regulations vary and are subject to change.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Limitation of Liability</h2>
            <p>
              Go Foreign is not liable for indirect, incidental, or consequential damages arising
              from use of our services or website.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-[#C99A2E]">Contact Us</h2>
            <p>
              Questions about these terms can be directed to Go Foreign through the contact
              methods listed on our site.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
