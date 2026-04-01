import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/lesson";
import { getCourse, getLessonContent } from "~/lib/courses.server";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.lesson) {
    return [{ title: "Lesson Not Found — Hatch" }];
  }
  return [{ title: `${data.lesson.title} — Hatch` }];
}

export function loader({ params }: Route.LoaderArgs) {
  const course = getCourse(params.courseSlug);
  if (!course) throw new Response("Course not found", { status: 404 });

  const lesson = getLessonContent(
    params.courseSlug,
    params.moduleSlug,
    params.lessonSlug
  );
  if (!lesson) throw new Response("Lesson not found", { status: 404 });

  // Build flat list for prev/next
  const allLessons: {
    moduleSlug: string;
    lessonSlug: string;
    title: string;
  }[] = [];
  for (const mod of course.modules) {
    for (const l of mod.lessons) {
      allLessons.push({
        moduleSlug: mod.slug,
        lessonSlug: l.slug,
        title: l.title,
      });
    }
  }
  const currentIdx = allLessons.findIndex(
    (l) =>
      l.moduleSlug === params.moduleSlug && l.lessonSlug === params.lessonSlug
  );
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return {
    course: { title: course.title, slug: course.slug, modules: course.modules },
    currentModule: params.moduleSlug,
    currentLesson: params.lessonSlug,
    lesson,
    prev,
    next,
    totalLessons: allLessons.length,
    currentLessonIndex: currentIdx,
  };
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const {
    course,
    currentModule,
    currentLesson,
    lesson,
    prev,
    next,
    totalLessons,
    currentLessonIndex,
  } = loaderData;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Progress (for now, treat current + all prior as "visited")
  const progressPercent = Math.round(
    ((currentLessonIndex + 1) / totalLessons) * 100
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        aria-label="Toggle course outline"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 z-40 lg:z-0
          h-[calc(100vh-4rem)] w-80 shrink-0
          bg-white border-r border-gray-100 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Progress header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
          <Link
            to={`/courses/${course.slug}`}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; {course.title}
          </Link>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {currentLessonIndex + 1} of {totalLessons} lessons
            </span>
            <span className="font-medium text-gray-700">
              {progressPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-violet to-brand-coral rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Module list */}
        <nav className="px-3 py-3">
          {course.modules.map((mod, modIdx) => {
            const isCurrentModule = mod.slug === currentModule;
            return (
              <div key={mod.slug} className="mb-1">
                <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span className="text-gray-300 mr-1">
                    {String(modIdx + 1).padStart(2, "0")}
                  </span>
                  {mod.title}
                </div>
                <ul>
                  {mod.lessons.map((l) => {
                    const isActive =
                      mod.slug === currentModule && l.slug === currentLesson;

                    // Determine lesson index in flat list
                    let lessonFlatIdx = 0;
                    for (const m of course.modules) {
                      for (const ll of m.lessons) {
                        if (m.slug === mod.slug && ll.slug === l.slug) break;
                        lessonFlatIdx++;
                      }
                      if (
                        course.modules.indexOf(m) === modIdx &&
                        m.lessons.indexOf(l) !== -1
                      )
                        break;
                    }

                    const isPast =
                      getFlatIndex(course.modules, mod.slug, l.slug) <
                      currentLessonIndex;
                    const isCurrent = isActive;

                    return (
                      <li key={l.slug}>
                        <Link
                          to={`/courses/${course.slug}/${mod.slug}/${l.slug}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                            ${
                              isCurrent
                                ? "bg-brand-violet-50 text-gray-900 font-medium"
                                : isPast
                                  ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }
                          `}
                        >
                          {/* Status indicator */}
                          <span className="shrink-0">
                            {isPast ? (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-brand-violet"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : isCurrent ? (
                              <span className="block w-4 h-4 rounded-full border-[3px] border-brand-coral" />
                            ) : (
                              <span className="block w-4 h-4 rounded-full border-2 border-gray-200" />
                            )}
                          </span>
                          <span className="truncate">{l.title}</span>
                          <span className="ml-auto text-xs text-gray-300 shrink-0">
                            {l.duration}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Gradient header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-violet-50 via-brand-rose-50 to-brand-amber-50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_0%,var(--color-brand-indigo-50),transparent),radial-gradient(ellipse_50%_60%_at_10%_100%,var(--color-brand-coral-50),transparent)]" />
          <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              <Link
                to="/courses"
                className="hover:text-gray-600 transition-colors"
              >
                Courses
              </Link>
              <span>/</span>
              <Link
                to={`/courses/${course.slug}`}
                className="hover:text-gray-600 transition-colors"
              >
                {course.title}
              </Link>
              <span>/</span>
              <span className="text-gray-600">{lesson.title}</span>
            </div>

            {/* Lesson Header */}
            <h1 className="text-3xl font-bold text-gray-900">
              {lesson.title}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
              <span>{lesson.duration}</span>
              <button className="text-brand-coral hover:text-brand-rose font-medium transition-colors">
                Mark Complete
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-10">
          {/* Video */}
          {lesson.video && (
            <div className="mb-10 rounded-2xl overflow-hidden bg-black">
              <video
                controls
                playsInline
                className="w-full"
                preload="metadata"
              >
                <source src={lesson.video.url} type={lesson.video.type} />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* Content */}
          <article
            className="prose prose-gray prose-headings:tracking-tight prose-a:text-brand-coral prose-code:text-brand-violet prose-code:bg-brand-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.html }}
          />

          {/* Navigation */}
          <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between pb-12">
            {prev ? (
              <Link
                to={`/courses/${course.slug}/${prev.moduleSlug}/${prev.lessonSlug}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                &larr; {prev.title}
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to={`/courses/${course.slug}/${next.moduleSlug}/${next.lessonSlug}`}
                className="text-sm text-brand-coral hover:text-brand-rose font-medium transition-colors"
              >
                {next.title} &rarr;
              </Link>
            ) : (
              <Link
                to={`/courses/${course.slug}`}
                className="text-sm text-brand-coral hover:text-brand-rose font-medium transition-colors"
              >
                Back to Course &rarr;
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getFlatIndex(
  modules: { slug: string; lessons: { slug: string }[] }[],
  moduleSlug: string,
  lessonSlug: string
): number {
  let idx = 0;
  for (const mod of modules) {
    for (const l of mod.lessons) {
      if (mod.slug === moduleSlug && l.slug === lessonSlug) return idx;
      idx++;
    }
  }
  return -1;
}
