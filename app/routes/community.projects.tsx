import { Link } from "react-router";
import type { Route } from "./+types/community.projects";
import { db } from "~/db";
import { projects, profiles } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export function meta() {
  return [{ title: "Projects — Community — Hatch" }];
}

export async function loader() {
  const allProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      url: projects.url,
      imageUrl: projects.imageUrl,
      tags: projects.tags,
      createdAt: projects.createdAt,
      userId: projects.userId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(projects)
    .leftJoin(profiles, eq(projects.userId, profiles.userId))
    .orderBy(desc(projects.createdAt))
    .limit(60);

  return { projects: allProjects };
}

export default function CommunityProjects({ loaderData }: Route.ComponentProps) {
  const { projects } = loaderData;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to="/community"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Community
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Projects</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Project Showcase</h1>
        <p className="mt-2 text-gray-500">
          See what the Hatch community has been building.
        </p>
      </div>

      {projects.length === 0 ? (
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-gray-400">
            No projects shared yet. Add yours from your profile!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const tags: string[] = project.tags
              ? JSON.parse(project.tags)
              : [];
            return (
              <div
                key={project.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
              >
                {project.imageUrl ? (
                  <div className="aspect-video bg-gray-50">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-gray-200"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
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

                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <Link
                      to={`/members/${project.userId}`}
                      className="flex items-center gap-2 group"
                    >
                      <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden">
                        {project.avatarUrl ? (
                          <img
                            src={project.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              width="10"
                              height="10"
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
                      <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                        {project.displayName || "Member"}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
