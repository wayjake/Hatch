import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getCourses } from "~/lib/courses.server";
import { CourseCard } from "~/components/course-card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hatch — Launch Your Knowledge" },
    {
      name: "description",
      content:
        "Create, deliver, and sell beautiful online courses. From markdown to teleprompter — everything you need to hatch something great.",
    },
  ];
}

export function loader() {
  const courses = getCourses();
  return { courses };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Now in early access
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            Hatch something
            <br />
            <span className="text-amber-500">worth sharing.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 leading-relaxed">
            A modern platform for creating and delivering online courses.
            Write in Markdown, record with the teleprompter, and launch
            to learners everywhere.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/courses"
              className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse Courses
            </Link>
            <Link
              to="/teleprompter"
              className="px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Open Teleprompter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              title="Write in Markdown"
              description="Author your course content in simple Markdown files. Organize into modules and lessons with images, video, and code."
              icon={
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
              }
            />
            <Feature
              title="Record & Present"
              description="Use the built-in teleprompter to read your lesson scripts while recording. Smooth scrolling, adjustable speed, full-screen mode."
              icon={
                <path d="M23 7l-7 5 7 5V7z M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z" />
              }
            />
            <Feature
              title="Launch & Grow"
              description="Publish courses for learners to browse, preview, purchase, and complete. Track progress and build your audience."
              icon={
                <>
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Courses
            </h2>
            <Link
              to="/courses"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} Hatch</span>
          <span>Built for creators.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-600"
        >
          {icon}
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
