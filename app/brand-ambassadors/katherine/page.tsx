import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katherine",
  description:
    "Katherine is a Go Foreign Rio Lifestyle Ambassador for events, nightlife, boat parties, and concierge experiences.",
};

export default function KatherinePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/brand-ambassadors" className="text-sm text-yellow-400">
          ← Back to Brand Ambassadors
        </Link>

        <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              GOFOREIGN Ambassador
            </p>

            <h1 className="mt-4 text-5xl font-bold">Katherine</h1>

            <p className="mt-4 text-xl text-zinc-300">
              Rio Lifestyle Ambassador • Events • Nightlife • Boat Parties • Concierge
            </p>

            <p className="mt-6 text-zinc-300 leading-8">
              Katherine is a bold Brazilian model and lifestyle ambassador with
              striking green eyes, a beautiful smile, and a strong presence in
              front of the camera. Before moving fully into Rio’s lifestyle and
              event scene, she built experience through promotional modeling,
              club openings, liquor events, and brand activations in Recife and Rio.
            </p>

            <p className="mt-4 text-zinc-300 leading-8">
              She has also appeared in multiple Brazilian novela productions,
              giving her a natural camera presence and polished entertainment
              background. Katherine has represented GOFOREIGN for over six months
              as part of our lifestyle, nightlife, and concierge network.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#booking"
                className="rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
              >
                Book Through Management
              </a>

              <a
                href="#gallery"
                className="rounded-full border border-yellow-400 px-6 py-3 font-semibold text-yellow-400 hover:bg-yellow-400 hover:text-black"
              >
                View Gallery
              </a>
            </div>
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-3xl border border-zinc-800">
            <Image
              src="/ambassadors/katherine.jpeg"
              alt="Katherine, GoForeign Ambassador"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Katherine Gallery</h2>
        <p className="mt-3 text-zinc-400">
          Lifestyle, events, nightlife, and ambassador content. More photos coming soon.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="relative h-80 w-full overflow-hidden rounded-2xl">
            <Image
              src="/ambassadors/katherine.jpeg"
              alt="Katherine lifestyle photo"
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="relative h-80 w-full overflow-hidden rounded-2xl bg-zinc-900">
              <Image
                src="/ambassadors/placeholder.jpeg"
                alt="More Katherine photos coming soon"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
                  Coming Soon
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">Available For</h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            "Club openings",
            "Liquor brand promotions",
            "Boat parties",
            "Private events",
            "VIP nightlife hosting",
            "Rio concierge services",
            "Brand activations",
            "Photo and video appearances",
            "Lifestyle hosting",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="booking" className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-yellow-400 p-10 text-black">
          <h2 className="text-4xl font-bold">
            Book Katherine Through GOFOREIGN
          </h2>

          <p className="mt-4 max-w-3xl text-lg">
            All bookings are handled through our management company. Pricing
            depends on the event, location, time, travel needs, and production
            requirements.
          </p>

          <a
            href="mailto:management@goforeign.com?subject=Booking Katherine"
            className="mt-8 inline-block rounded-full bg-black px-7 py-3 font-semibold text-white"
          >
            Contact Management
          </a>
        </div>
      </section>
    </main>
  );
}
