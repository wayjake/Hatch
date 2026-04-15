import { Link } from "react-router";
import type { Route } from "./+types/member";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { profiles, users, enrollments, lessonCompletions, projects } from "~/db/schema";
import { desc } from "drizzle-orm";
import { getAuthUserId } from "~/lib/auth.server";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.profile?.displayName || "Member";
  return [{ title: `${name} — Hatch` }];
}

export async function loader(args: Route.LoaderArgs) {
  const { params } = args;
  const userId = params.userId;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new Response("Member not found", { status: 404 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, userId),
  });

  const completionCount = await db.query.lessonCompletions.findMany({
    where: eq(lessonCompletions.userId, userId),
  });

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: [desc(projects.createdAt)],
  });

  const currentUserId = await getAuthUserId(args);
  const isOwner = currentUserId === userId;

  return {
    profile: profile || {
      userId,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Member",
      bio: "",
      headline: "",
      avatarUrl: null,
      location: "",
      websiteUrl: "",
      githubUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
    },
    stats: {
      coursesEnrolled: userEnrollments.length,
      lessonsCompleted: completionCount.length,
    },
    projects: userProjects,
    memberSince: user.createdAt,
    isOwner,
  };
}

export default function MemberProfile({ loaderData }: Route.ComponentProps) {
  const { profile, stats, projects: userProjects, memberSince, isOwner } = loaderData;

  const links = [
    { label: "Website", url: profile.websiteUrl, icon: GlobeIcon },
    { label: "GitHub", url: profile.githubUrl, icon: GitHubIcon },
    { label: "Twitter", url: profile.twitterUrl, icon: TwitterIcon },
    { label: "LinkedIn", url: profile.linkedinUrl, icon: LinkedInIcon },
  ].filter((l) => l.url);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                width="40"
                height="40"
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {profile.displayName || "Member"}
            </h1>
            {isOwner && (
              <Link
                to="/profile/edit"
                className="shrink-0 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Edit
              </Link>
            )}
          </div>
          {profile.headline && (
            <p className="mt-1 text-gray-500">{profile.headline}</p>
          )}
          {profile.location && (
            <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-8">
          <p className="text-gray-600 whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {/* Links */}
      {links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <link.icon />
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {stats.coursesEnrolled}
          </div>
          <div className="text-xs text-gray-500 mt-1">Courses Enrolled</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {stats.lessonsCompleted}
          </div>
          <div className="text-xs text-gray-500 mt-1">Lessons Completed</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm font-medium text-gray-900">
            {new Date(memberSince).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="text-xs text-gray-500 mt-1">Member Since</div>
        </div>
      </div>

      {/* Projects */}
      {(userProjects.length > 0 || isOwner) && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Projects
              {userProjects.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({userProjects.length})
                </span>
              )}
            </h2>
            {isOwner && (
              <Link
                to="/projects/new"
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add Project
              </Link>
            )}
          </div>

          {userProjects.length === 0 && isOwner && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-400">
                Showcase what you've been building!
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {userProjects.map((project) => {
              const tags: string[] = project.tags
                ? JSON.parse(project.tags)
                : [];
              return (
                <div
                  key={project.id}
                  className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors"
                >
                  {project.imageUrl && (
                    <div className="aspect-video bg-gray-50">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {project.url ? (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-violet transition-colors"
                            >
                              {project.title}
                              <span className="ml-1 text-gray-300">&rarr;</span>
                            </a>
                          ) : (
                            project.title
                          )}
                        </h3>
                        {project.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <Link
                          to={`/projects/new?id=${project.id}`}
                          className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs text-brand-violet bg-brand-violet-50 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
