import { Link } from "react-router";
import type { Route } from "./+types/course-detail";
import { getCourse } from "~/lib/courses.server";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.course) {
    return [{ title: "Course Not Found — Hatch" }];
  }
  return [
    { title: `${data.course.title} — Hatch` },
    { name: "description", content: data.course.description },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    throw new Response("Course not found", { status: 404 });
  }
  return { course };
}

export default function CourseDetail({ loaderData }: Route.ComponentProps) {
  const { course } = loaderData;
  const lessonCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <div>
      {/* Header with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-violet-50 via-brand-rose-50 to-brand-amber-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_0%,var(--color-brand-indigo-50),transparent),radial-gradient(ellipse_50%_60%_at_10%_100%,var(--color-brand-coral-50),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12">
          <Link
            to="/courses"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; All Courses
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 tracking-tight">
            {course.title}
          </h1>
          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            {course.description}
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-gray-400">
            <span>By {course.author}</span>
            <span>&middot;</span>
            <span>
              {course.modules.length} modules &middot; {lessonCount} lessons
            </span>
            <span>&middot;</span>
            <span className="font-semibold text-gray-900">
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </span>
          </div>
          <div className="mt-8 flex gap-3">
            <button className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              {course.price === 0 ? "Start Learning" : "Purchase Course"}
            </button>
            <Link
              to={`/teleprompter?course=${course.slug}`}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-xl border border-white/60 hover:bg-white hover:border-gray-200 transition-colors"
            >
              Open in Teleprompter
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Curriculum
        </h2>
        <div className="space-y-4">
          {course.modules.map((mod, modIdx) => (
            <div
              key={mod.slug}
              className="border border-gray-100 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50/50">
                <h3 className="font-medium text-gray-900">
                  <span className="text-gray-400 mr-2">
                    {String(modIdx + 1).padStart(2, "0")}
                  </span>
                  {mod.title}
                </h3>
              </div>
              <ul className="divide-y divide-gray-50">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      to={`/courses/${course.slug}/${mod.slug}/${lesson.slug}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-brand-violet-50/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-brand-violet transition-colors flex items-center justify-center">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-gray-300 group-hover:text-brand-violet ml-0.5"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {lesson.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {lesson.duration}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
