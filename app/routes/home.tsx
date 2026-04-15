import { Link } from "react-router";
import { SignUpButton, useAuth } from "@clerk/react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hatch — A home for your expertise" },
    {
      name: "description",
      content:
        "Hatch gives creators a branded space for courses, community, and 1:1 time. Turn your expertise into a business your audience comes home to.",
    },
  ];
}

export default function Home() {
  return (
    <div>
      <WayfindingBanner />

      <Hero />

      <Problem />

      <Plan />

      <Success />

      <Stakes />

      <FinalCta />

      <Footer />
    </div>
  );
}

function WayfindingBanner() {
  return (
    <div className="border-b border-gray-100 bg-gradient-to-r from-brand-amber-50 via-brand-coral-50 to-brand-violet-50">
      <div className="max-w-6xl mx-auto px-6 py-2.5 text-center text-xs md:text-sm text-gray-700">
        Looking for a specific creator?{" "}
        <Link
          to="/creators"
          className="font-semibold text-gray-900 underline underline-offset-2 hover:text-brand-coral transition-colors"
        >
          Browse creators &rarr;
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-brand-amber/30 via-brand-coral/20 to-transparent blur-3xl" />
        <div className="absolute top-20 right-[-120px] h-[460px] w-[460px] rounded-full bg-gradient-to-br from-brand-violet/30 via-brand-indigo/20 to-transparent blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur ring-1 ring-amber-200/70 text-amber-700 text-xs font-semibold mb-6 shadow-sm shadow-amber-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand-amber to-brand-coral" />
            For creators in early access
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
            Turn your expertise into a{" "}
            <span className="bg-gradient-to-r from-brand-amber via-brand-coral to-brand-violet bg-clip-text text-transparent">
              home your audience
            </span>{" "}
            comes back to.
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl">
            Hatch gives creators a branded space for courses, community,
            and 1:1 time &mdash; all under your own URL, all yours. Built by
            creators who've shipped what they teach.
          </p>
          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <StartCta label="Start your Hatch" />
            <Link
              to="/creators"
              className="px-6 py-3 bg-white/90 backdrop-blur text-gray-800 text-sm font-semibold rounded-xl ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-white transition-colors"
            >
              See it in action
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/60">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand-amber to-brand-coral" />
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.14em]">
            The problem
          </h2>
        </div>
        <p className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight tracking-tight">
          Your audience is scattered across DMs, unpaid consults, one-off
          Zoom calls, and Notion docs they can't find.
        </p>
        <p className="mt-5 text-lg text-gray-600 leading-relaxed">
          Your expertise works harder than you do. Every lead leaks through
          a link that dies next week. Every testimonial lives in someone
          else's inbox. And the business you know you could build lives
          somewhere between &ldquo;one day&rdquo; and the next Zoom at 2pm.
        </p>
      </div>
    </section>
  );
}

function Plan() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center gap-2 mb-10">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand-amber to-brand-coral" />
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.14em]">
            Three steps to your own space
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step
            number="01"
            title="Claim your space"
            description="Pick a handle. Get a branded lead page at your own URL. Your logo, your color, your story — not ours."
            gradient="from-brand-amber to-brand-coral"
            shadow="shadow-brand-amber/30"
          />
          <Step
            number="02"
            title="Ship your courses"
            description="Write in Markdown. Record with the built-in teleprompter. Publish. Your audience buys, learns, and comes back for more."
            gradient="from-brand-coral to-brand-rose"
            shadow="shadow-brand-coral/30"
          />
          <Step
            number="03"
            title="Book your time"
            description="Connect your calendar and get paid for the 1:1s you were giving away anyway. Hatch handles checkout so you don't."
            gradient="from-brand-violet to-brand-indigo"
            shadow="shadow-brand-violet/30"
          />
        </div>
      </div>
    </section>
  );
}

function Success() {
  return (
    <section className="border-t border-gray-100 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand-violet to-brand-indigo" />
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.14em]">
            What changes
          </h2>
        </div>
        <p className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight tracking-tight">
          Your audience in one place. Courses, community, and bookings
          &mdash; all under your brand.
        </p>
        <p className="mt-5 text-lg text-gray-600 leading-relaxed">
          When someone asks where to find you, you send one link. When they
          want more, they buy a course. When they want your time, they book
          it. When they want to build alongside other people you're helping,
          they find each other in your community. You stop running a
          business made of tabs.
        </p>
      </div>
    </section>
  );
}

function Stakes() {
  return (
    <section className="border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="inline-block w-10 h-0.5 bg-gradient-to-r from-brand-amber to-brand-coral mb-6" />
        <p className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight tracking-tight">
          Without a home, every lead forgets where to find you.
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-gray-100 bg-gradient-to-b from-white via-gray-50/80 to-white">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Ready to stop being a tab?
        </h2>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Early-bird plans start at $25/mo. Keep your courses, your
          community, and your calendar in one branded home.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <StartCta label="Claim my space" signedOutLabel="Start your Hatch" large />
          <Link
            to="/creators"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            Browse creators &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

function StartCta({
  label,
  signedOutLabel,
  large,
}: {
  label: string;
  signedOutLabel?: string;
  large?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const padding = large ? "px-7 py-3.5" : "px-6 py-3";
  const className = `${padding} bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-lg shadow-gray-900/15 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-0.5 transition-all`;

  if (isSignedIn) {
    return (
      <Link to="/become-a-creator" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <SignUpButton mode="modal">
      <button className={className}>{signedOutLabel ?? label}</button>
    </SignUpButton>
  );
}

function Step({
  number,
  title,
  description,
  gradient,
  shadow,
}: {
  number: string;
  title: string;
  description: string;
  gradient: string;
  shadow: string;
}) {
  return (
    <div>
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg ${shadow} text-white text-sm font-bold`}
      >
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
        <span>&copy; {new Date().getFullYear()} Hatch</span>
        <Link to="/creators" className="hover:text-gray-900 transition-colors">
          Creators
        </Link>
      </div>
    </footer>
  );
}
