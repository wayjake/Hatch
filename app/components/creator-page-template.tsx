import { Link } from "react-router";
import type { Course } from "~/lib/courses.server";
import type { Creator, ParsedLeadPage } from "~/lib/creators.server";

export function CreatorPageTemplate({
  creator,
  leadPage,
  featuredCourses,
}: {
  creator: Creator;
  leadPage: ParsedLeadPage;
  featuredCourses: Course[];
}) {
  const brand = creator.brandColor || "#111827";
  const showFooter = !creator.hideHatchFooter;

  return (
    <div className="min-h-screen bg-white">
      <CreatorHeader creator={creator} brand={brand} />

      <main>
        <Hero leadPage={leadPage} brand={brand} />

        {leadPage.about && <About creator={creator} leadPage={leadPage} />}

        {leadPage.parsedSteps.length > 0 && (
          <Plan steps={leadPage.parsedSteps} brand={brand} />
        )}

        {featuredCourses.length > 0 && (
          <FeaturedCourses courses={featuredCourses} brand={brand} />
        )}

        {leadPage.parsedTestimonials.length > 0 && (
          <Testimonials testimonials={leadPage.parsedTestimonials} />
        )}

        {leadPage.stakesLine && (
          <Stakes line={leadPage.stakesLine} brand={brand} />
        )}

        {leadPage.ctaLabel && leadPage.ctaUrl && (
          <FinalCta leadPage={leadPage} brand={brand} />
        )}
      </main>

      <CreatorFooter
        creator={creator}
        showHatchFooter={showFooter}
      />
    </div>
  );
}

function CreatorHeader({ creator, brand }: { creator: Creator; brand: string }) {
  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {creator.logoUrl ? (
            <img
              src={creator.logoUrl}
              alt={creator.displayName}
              className="w-9 h-9 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: brand }}
            >
              {creator.displayName.charAt(0)}
            </div>
          )}
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            {creator.displayName}
          </span>
        </div>
      </div>
    </header>
  );
}

function Hero({
  leadPage,
  brand,
}: {
  leadPage: ParsedLeadPage;
  brand: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: brand }}
        />
      </div>
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05]">
            {leadPage.headline || "Your expertise, in one place."}
          </h1>
          {leadPage.subhead && (
            <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl">
              {leadPage.subhead}
            </p>
          )}
          {leadPage.ctaLabel && leadPage.ctaUrl && (
            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <a
                href={leadPage.ctaUrl}
                className="px-7 py-3.5 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: brand }}
              >
                {leadPage.ctaLabel}
              </a>
            </div>
          )}
        </div>
      </div>
      {leadPage.heroImageUrl && (
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <img
            src={leadPage.heroImageUrl}
            alt=""
            className="w-full rounded-2xl border border-gray-100 shadow-sm"
          />
        </div>
      )}
    </section>
  );
}

function About({
  creator,
  leadPage,
}: {
  creator: Creator;
  leadPage: ParsedLeadPage;
}) {
  return (
    <section className="border-t border-gray-100 bg-gray-50/60">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-[0.14em] mb-4">
          About {creator.displayName}
        </div>
        {creator.tagline && (
          <p className="text-lg text-gray-700 font-medium mb-4">
            {creator.tagline}
          </p>
        )}
        <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
          {leadPage.about}
        </p>
      </div>
    </section>
  );
}

function Plan({
  steps,
  brand,
}: {
  steps: { title: string; description: string }[];
  brand: string;
}) {
  return (
    <section>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-2 mb-10">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: brand }}
          />
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-[0.14em]">
            How it works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold mb-5 shadow-md"
                style={{ backgroundColor: brand }}
              >
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCourses({
  courses,
  brand,
}: {
  courses: Course[];
  brand: string;
}) {
  return (
    <section className="border-t border-gray-100 bg-gray-50/60">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.slug}
              to={`/courses/${course.slug}`}
              className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div
                className="aspect-[16/9] flex items-center justify-center"
                style={{ backgroundColor: `${brand}12` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: brand }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-4 text-sm font-semibold text-gray-900">
                  {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({
  testimonials,
}: {
  testimonials: { quote: string; author: string; role?: string }[];
}) {
  return (
    <section>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm"
            >
              <p className="text-base text-gray-800 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-4 text-sm">
                <div className="font-semibold text-gray-900">{t.author}</div>
                {t.role && <div className="text-gray-500">{t.role}</div>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stakes({ line, brand }: { line: string; brand: string }) {
  return (
    <section className="border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div
          className="inline-block w-10 h-0.5 mb-6"
          style={{ backgroundColor: brand }}
        />
        <p className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">
          {line}
        </p>
      </div>
    </section>
  );
}

function FinalCta({
  leadPage,
  brand,
}: {
  leadPage: ParsedLeadPage;
  brand: string;
}) {
  return (
    <section className="border-t border-gray-100 bg-gray-50/60">
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <a
          href={leadPage.ctaUrl}
          className="inline-block px-8 py-4 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: brand }}
        >
          {leadPage.ctaLabel}
        </a>
      </div>
    </section>
  );
}

function CreatorFooter({
  creator,
  showHatchFooter,
}: {
  creator: Creator;
  showHatchFooter: boolean;
}) {
  return (
    <footer className="border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <span>
          &copy; {new Date().getFullYear()} {creator.displayName}
        </span>
        {showHatchFooter && (
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            Powered by Hatch &rarr;
          </Link>
        )}
      </div>
    </footer>
  );
}
