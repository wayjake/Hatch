import { useState } from "react";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types/lesson";
import {
  getRuntimeCourse,
  getRuntimeLessonContent,
} from "~/lib/course-publishing.server";
import { checkModuleAccess, getOrCreateUser } from "~/lib/auth.server";
import { db } from "~/db";
import { lessonCompletions, comments, commentVotes, profiles, users } from "~/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { getAuth } from "@clerk/react-router/server";
import { SignInButton, SignUpButton } from "@clerk/react-router";

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
  const course = await getRuntimeCourse(params.courseSlug);
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

  // Editor-only affordances (teleprompter, etc.) — visible to creators/admins
  const auth = await getAuth(args);
  let canEdit = false;
  if (auth.userId) {
    const editor = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    });
    canEdit = editor?.role === "creator" || editor?.role === "admin";
  }

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
      questions: [] as {
        id: number;
        content: string;
        createdAt: Date;
        userId: string;
        displayName: string;
        avatarUrl: string | null;
        voteCount: number;
        userVoted: boolean;
        replies: {
          id: number;
          content: string;
          createdAt: Date;
          userId: string;
          displayName: string;
          avatarUrl: string | null;
          voteCount: number;
          userVoted: boolean;
        }[];
      }[],
      currentUserId: null as string | null,
      canEdit,
    };
  }

  const currentUser = await getOrCreateUser(args);
  const lesson = await getRuntimeLessonContent(
    params.courseSlug,
    params.moduleSlug,
    params.lessonSlug,
    currentUser
  );
  if (!lesson) throw new Response("Lesson not found", { status: 404 });

  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Load completion data if signed in
  let completedLessons: string[] = [];
  if (access.userId) {
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

  // Load Q&A for this lesson
  const allComments = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      voteCount: sql<number>`(select count(*) from comment_votes where comment_id = ${comments.id})`,
      userVoted: access.userId
        ? sql<number>`(select count(*) from comment_votes where comment_id = ${comments.id} and user_id = ${access.userId})`
        : sql<number>`0`,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.userId, profiles.userId))
    .where(
      and(
        eq(comments.courseSlug, params.courseSlug),
        eq(comments.moduleSlug, params.moduleSlug),
        eq(comments.lessonSlug, params.lessonSlug)
      )
    )
    .orderBy(desc(comments.createdAt));

  // Build threaded structure
  const topLevel = allComments.filter((c) => !c.parentId);
  const repliesByParent = new Map<number, typeof allComments>();
  for (const c of allComments) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) || [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
  }

  const questions = topLevel.map((q) => ({
    id: q.id,
    content: q.content,
    createdAt: q.createdAt,
    userId: q.userId,
    displayName: q.displayName || "Member",
    avatarUrl: q.avatarUrl,
    voteCount: Number(q.voteCount),
    userVoted: Number(q.userVoted) > 0,
    replies: (repliesByParent.get(q.id) || []).map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      userId: r.userId,
      displayName: r.displayName || "Member",
      avatarUrl: r.avatarUrl,
      voteCount: Number(r.voteCount),
      userVoted: Number(r.userVoted) > 0,
    })),
  }));

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
    questions,
    currentUserId: access.userId || null,
    canEdit,
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

  if (intent === "post-question" || intent === "post-reply") {
    const content = (formData.get("content") as string)?.trim();
    if (!content) return { ok: false };

    const parentId = intent === "post-reply"
      ? Number(formData.get("parentId"))
      : null;

    await db.insert(comments).values({
      parentId,
      userId: auth.userId,
      courseSlug: params.courseSlug,
      moduleSlug: params.moduleSlug,
      lessonSlug: params.lessonSlug,
      content,
    });
    return { ok: true };
  }

  if (intent === "vote") {
    const commentId = Number(formData.get("commentId"));
    if (!commentId) return { ok: false };

    // Toggle vote
    const existing = await db.query.commentVotes.findFirst({
      where: and(
        eq(commentVotes.commentId, commentId),
        eq(commentVotes.userId, auth.userId)
      ),
    });

    if (existing) {
      await db
        .delete(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, commentId),
            eq(commentVotes.userId, auth.userId)
          )
        );
    } else {
      await db
        .insert(commentVotes)
        .values({ commentId, userId: auth.userId })
        .onConflictDoNothing();
    }
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
    currentUserId,
    canEdit,
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
          {canEdit && (
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
          )}
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
              {!gated && currentUserId && (
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
              {!gated && !currentUserId && (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="font-medium text-brand-coral hover:text-brand-rose transition-colors"
                  >
                    Sign in to track progress
                  </button>
                </SignInButton>
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
                    key={lesson.video.url}
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

              {/* Q&A Section */}
              <LessonQA
                questions={loaderData.questions ?? []}
                currentUserId={loaderData.currentUserId ?? null}
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

function LessonQA({
  questions,
  currentUserId,
}: {
  questions: {
    id: number;
    content: string;
    createdAt: Date;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    voteCount: number;
    userVoted: boolean;
    replies: {
      id: number;
      content: string;
      createdAt: Date;
      userId: string;
      displayName: string;
      avatarUrl: string | null;
      voteCount: number;
      userVoted: boolean;
    }[];
  }[];
  currentUserId: string | null;
}) {
  const fetcher = useFetcher();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  return (
    <div className="mt-16 pt-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Questions & Discussion
        {questions.length > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({questions.length})
          </span>
        )}
      </h2>

      {/* Post a question */}
      {currentUserId && (
        <fetcher.Form method="post" className="mb-8">
          <input type="hidden" name="intent" value="post-question" />
          <textarea
            name="content"
            rows={3}
            placeholder="Ask a question about this lesson..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet resize-none"
            required
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Post Question
            </button>
          </div>
        </fetcher.Form>
      )}

      {!currentUserId && (
        <p className="mb-8 text-sm text-gray-400">
          Sign in to ask questions and join the discussion.
        </p>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="group">
            <div className="flex gap-3">
              {/* Avatar */}
              <Link to={`/members/${q.userId}`} className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                  {q.avatarUrl ? (
                    <img src={q.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/members/${q.userId}`}
                    className="text-sm font-medium text-gray-900 hover:text-brand-violet transition-colors"
                  >
                    {q.displayName}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {timeAgo(q.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-line">{q.content}</p>

                {/* Actions */}
                <div className="mt-2 flex items-center gap-4">
                  {currentUserId && (
                    <fetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="vote" />
                      <input type="hidden" name="commentId" value={q.id} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          q.userVoted
                            ? "text-brand-violet font-medium"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={q.userVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        {q.voteCount > 0 && q.voteCount}
                      </button>
                    </fetcher.Form>
                  )}
                  {currentUserId && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === q.id && (
                  <fetcher.Form
                    method="post"
                    className="mt-3"
                    onSubmit={() => setReplyingTo(null)}
                  >
                    <input type="hidden" name="intent" value="post-reply" />
                    <input type="hidden" name="parentId" value={q.id} />
                    <textarea
                      name="content"
                      rows={2}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet resize-none"
                      required
                      autoFocus
                    />
                    <div className="mt-1.5 flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </fetcher.Form>
                )}

                {/* Replies */}
                {q.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
                    {q.replies.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <Link to={`/members/${r.userId}`} className="shrink-0">
                          <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden">
                            {r.avatarUrl ? (
                              <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link
                              to={`/members/${r.userId}`}
                              className="text-sm font-medium text-gray-900 hover:text-brand-violet transition-colors"
                            >
                              {r.displayName}
                            </Link>
                            <span className="text-xs text-gray-400">
                              {timeAgo(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{r.content}</p>
                          {currentUserId && (
                            <fetcher.Form method="post" className="inline mt-1">
                              <input type="hidden" name="intent" value="vote" />
                              <input type="hidden" name="commentId" value={r.id} />
                              <button
                                type="submit"
                                className={`flex items-center gap-1 text-xs mt-1 transition-colors ${
                                  r.userVoted
                                    ? "text-brand-violet font-medium"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={r.userVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                  <path d="M12 19V5M5 12l7-7 7 7" />
                                </svg>
                                {r.voteCount > 0 && r.voteCount}
                              </button>
                            </fetcher.Form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && currentUserId && (
        <p className="text-sm text-gray-400 text-center py-6">
          No questions yet. Be the first to ask!
        </p>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
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
