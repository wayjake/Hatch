import { useState } from "react";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types/lesson";
import { getCourse, getLessonContent } from "~/lib/courses.server";
import { checkModuleAccess, getOrCreateUser } from "~/lib/auth.server";
import { db } from "~/db";
import { lessonCompletions } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/react-router/server";
import { SignUpButton } from "@clerk/react-router";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.lesson) {
    return [{ title: "Lesson Not Found — Hatch" }];
  }
  const tags: ReturnType<typeof Array<Record<string, string>>> = [
    { title: `${data.lesson.title} — Hatch` },
    { property: "og:title", content: `${data.lesson.title} — Hatch` },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${data.lesson.title} — Hatch` },
  ];
  if (data.lesson.description) {
    tags.push(
      { name: "description", content: data.lesson.description },
      { property: "og:description", content: data.lesson.description },
      { name: "twitter:description", content: data.lesson.description }
    );
  }
  const thumbnail = data.lesson.video?.thumbnail;
  if (thumbnail) {
    tags.push(
      { property: "og:image", content: thumbnail },
      { name: "twitter:image", content: thumbnail }
    );
  }
  return tags;
}

export async function loader(args: Route.LoaderArgs) {
  const { params } = args;
  const course = getCourse(params.courseSlug);
  if (!course) throw new Response("Course not found", { status: 404 });

  // Find the module this lesson belongs to
  const currentMod = course.modules.find((m) => m.slug === params.moduleSlug);
  if (!currentMod) throw new Response("Module not found", { status: 404 });

  // Check access
  const access = await checkModuleAccess(
    args,
    params.courseSlug,
    currentMod.access
  );

  // Build flat list for prev/next (always needed for sidebar)
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

  if (!access.allowed) {
    // Return enough data to render the gated view
    return {
      course: {
        title: course.title,
        slug: course.slug,
        modules: course.modules,
        price: course.price,
      },
      currentModule: params.moduleSlug,
      currentLesson: params.lessonSlug,
      lesson: {
        title: currentMod.lessons.find((l) => l.slug === params.lessonSlug)
          ?.title || "Lesson",
        description: "",
        duration: currentMod.lessons.find((l) => l.slug === params.lessonSlug)
          ?.duration || "",
        html: "",
        raw: "",
        video: null,
      },
      prev: currentIdx > 0 ? allLessons[currentIdx - 1] : null,
      next:
        currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null,
      totalLessons: allLessons.length,
      currentLessonIndex: currentIdx,
      gated: access.reason as "auth" | "purchase",
      completedLessons: [] as string[],
    };
  }

  const lesson = getLessonContent(
    params.courseSlug,
    params.moduleSlug,
    params.lessonSlug
  );
  if (!lesson) throw new Response("Lesson not found", { status: 404 });

  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Load completion data if signed in
  let completedLessons: string[] = [];
  if (access.userId) {
    await getOrCreateUser(args);
    const completions = await db.query.lessonCompletions.findMany({
      where: and(
        eq(lessonCompletions.userId, access.userId),
        eq(lessonCompletions.courseSlug, params.courseSlug)
      ),
    });
    completedLessons = completions.map(
      (c) => `${c.moduleSlug}/${c.lessonSlug}`
    );
  }

  return {
    course: {
      title: course.title,
      slug: course.slug,
      modules: course.modules,
      price: course.price,
    },
    currentModule: params.moduleSlug,
    currentLesson: params.lessonSlug,
    lesson,
    prev,
    next,
    totalLessons: allLessons.length,
    currentLessonIndex: currentIdx,
    gated: null,
    completedLessons,
  };
}

export async function action(args: Route.ActionArgs) {
  const { params, request } = args;
  const auth = await getAuth(args);
  if (!auth.userId) throw new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "complete") {
    await db
      .insert(lessonCompletions)
      .values({
        userId: auth.userId,
        courseSlug: params.courseSlug,
        moduleSlug: params.moduleSlug,
        lessonSlug: params.lessonSlug,
      })
      .onConflictDoNothing();
    return { ok: true };
  }

  if (intent === "uncomplete") {
    await db
      .delete(lessonCompletions)
      .where(
        and(
          eq(lessonCompletions.userId, auth.userId),
          eq(lessonCompletions.courseSlug, params.courseSlug),
          eq(lessonCompletions.moduleSlug, params.moduleSlug),
          eq(lessonCompletions.lessonSlug, params.lessonSlug)
        )
      );
    return { ok: true };
  }

  return { ok: false };
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
    gated,
    completedLessons,
  } = loaderData;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetcher = useFetcher();

  const isCurrentCompleted = completedLessons.includes(
    `${currentModule}/${currentLesson}`
  );
  const completedCount = completedLessons.length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

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
          <div className="mt-2">
            <Link
              to={`/teleprompter?course=${course.slug}&module=${currentModule}&lesson=${currentLesson}`}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-coral transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Open in Teleprompter
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              {completedCount} of {totalLessons} completed
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
            const isLocked =
              mod.access === "purchased" || mod.access === "account"
                ? !isModuleAccessible(mod.access, gated, completedLessons)
                : false;

            return (
              <div key={mod.slug} className="mb-1">
                <div className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-gray-300 mr-1">
                    {String(modIdx + 1).padStart(2, "0")}
                  </span>
                  {mod.title}
                  {mod.access === "purchased" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-300"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                      />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                  {mod.access === "account" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-300"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <ul>
                  {mod.lessons.map((l) => {
                    const isActive =
                      mod.slug === currentModule && l.slug === currentLesson;
                    const isCompleted = completedLessons.includes(
                      `${mod.slug}/${l.slug}`
                    );

                    return (
                      <li key={l.slug}>
                        <Link
                          to={`/courses/${course.slug}/${mod.slug}/${l.slug}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                            ${
                              isActive
                                ? "bg-brand-violet-50 text-gray-900 font-medium"
                                : isCompleted
                                  ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }
                          `}
                        >
                          <span className="shrink-0">
                            {isCompleted ? (
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
                            ) : isActive ? (
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

            <h1 className="text-3xl font-bold text-gray-900">
              {lesson.title}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
              <span>{lesson.duration}</span>
              {!gated && (
                <fetcher.Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value={isCurrentCompleted ? "uncomplete" : "complete"}
                  />
                  <button
                    type="submit"
                    className={`font-medium transition-colors ${
                      isCurrentCompleted
                        ? "text-brand-violet hover:text-brand-indigo"
                        : "text-brand-coral hover:text-brand-rose"
                    }`}
                  >
                    {isCurrentCompleted ? "Completed" : "Mark Complete"}
                  </button>
                </fetcher.Form>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-10">
          {/* Gated content */}
          {gated === "auth" && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-violet-50 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-brand-violet"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Create a free account to continue
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                This lesson requires a Hatch account. Sign up for free to
                access this module and track your progress.
              </p>
              <SignUpButton mode="modal">
                <button className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
                  Sign Up Free
                </button>
              </SignUpButton>
            </div>
          )}

          {gated === "purchase" && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-amber-50 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-brand-coral"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                This lesson is part of the full course
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Purchase the complete course to unlock all {totalLessons}{" "}
                lessons, including tutorials, templates, and the full
                curriculum.
              </p>
              <Link
                to={`/courses/${course.slug}`}
                className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Purchase Course —{" "}
                {course.price === 0
                  ? "Free"
                  : `$${course.price.toFixed(2)}`}
              </Link>
            </div>
          )}

          {/* Unlocked content */}
          {!gated && (
            <>
              {lesson.video && (
                <div className="mb-10 rounded-2xl overflow-hidden bg-black">
                  <video
                    controls
                    playsInline
                    className="w-full"
                    preload="metadata"
                    poster={lesson.video.thumbnail}
                  >
                    <source src={lesson.video.url} type={lesson.video.type} />
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              <article
                className="prose prose-gray prose-headings:tracking-tight prose-a:text-brand-coral prose-code:text-brand-violet prose-code:bg-brand-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.html }}
              />

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
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function isModuleAccessible(
  access: string | undefined,
  currentGated: "auth" | "purchase" | null,
  _completedLessons: string[]
): boolean {
  if (!access || access === "free") return true;
  if (currentGated === "auth") return false;
  if (currentGated === "purchase" && access === "purchased") return false;
  return true;
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
