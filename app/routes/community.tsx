import { Link } from "react-router";
import type { Route } from "./+types/community";
import { db } from "~/db";
import { comments, profiles } from "~/db/schema";
import { eq, isNull, desc, sql } from "drizzle-orm";

export function meta() {
  return [{ title: "Community — Hatch" }];
}

export async function loader() {
  // Fetch recent top-level questions across all lessons
  const recentQuestions = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      courseSlug: comments.courseSlug,
      moduleSlug: comments.moduleSlug,
      lessonSlug: comments.lessonSlug,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      replyCount: sql<number>`(select count(*) from comments c2 where c2.parent_id = ${comments.id})`,
      voteCount: sql<number>`(select count(*) from comment_votes where comment_id = ${comments.id})`,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.userId, profiles.userId))
    .where(isNull(comments.parentId))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return { questions: recentQuestions };
}

export default function Community({ loaderData }: Route.ComponentProps) {
  const { questions } = loaderData;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <p className="mt-2 text-gray-500">
          Recent questions and discussions from across the courses.
        </p>
        <div className="mt-4 flex gap-3">
          <span className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
            Q&A
          </span>
          <Link
            to="/community/projects"
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Projects
          </Link>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">
            No questions yet. Ask one on any lesson page!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {questions.map((q) => (
            <Link
              key={q.id}
              to={`/courses/${q.courseSlug}/${q.moduleSlug}/${q.lessonSlug}`}
              className="block px-4 py-4 -mx-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                  {q.avatarUrl ? (
                    <img
                      src={q.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {q.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-500">
                      {q.displayName || "Member"}
                    </span>
                    <span>{timeAgo(q.createdAt)}</span>
                    <span className="text-gray-300">in</span>
                    <span className="text-brand-violet group-hover:text-brand-indigo transition-colors truncate">
                      {formatLessonSlug(q.lessonSlug)}
                    </span>
                    {Number(q.replyCount) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {q.replyCount}
                      </span>
                    )}
                    {Number(q.voteCount) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        {q.voteCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLessonSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/^\d+\s*/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
