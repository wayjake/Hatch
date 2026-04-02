import { useFetcher } from "react-router";
import type { Route } from "./+types/admin.users";
import { db } from "~/db";
import { users, enrollments } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCourses } from "~/lib/courses.server";

export function meta() {
  return [{ title: "Users — Admin — Hatch" }];
}

export async function loader() {
  const allUsers = await db.query.users.findMany({
    orderBy: desc(users.createdAt),
  });
  const allEnrollments = await db.query.enrollments.findMany();
  const courses = getCourses();

  const usersWithEnrollments = allUsers.map((user) => ({
    ...user,
    enrollments: allEnrollments
      .filter((e) => e.userId === user.id)
      .map((e) => e.courseSlug),
  }));

  return { users: usersWithEnrollments, courses };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const userId = formData.get("userId") as string;

  if (intent === "enroll") {
    const courseSlug = formData.get("courseSlug") as string;
    await db
      .insert(enrollments)
      .values({ userId, courseSlug })
      .onConflictDoNothing();
    return { ok: true };
  }

  if (intent === "unenroll") {
    const courseSlug = formData.get("courseSlug") as string;
    await db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseSlug, courseSlug))
      );
    return { ok: true };
  }

  if (intent === "set-role") {
    const role = formData.get("role") as "customer" | "admin";
    await db.update(users).set({ role }).where(eq(users.id, userId));
    return { ok: true };
  }

  return { ok: false };
}

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const { users: allUsers, courses } = loaderData;
  const fetcher = useFetcher();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Users</h1>

      {allUsers.length === 0 ? (
        <p className="text-gray-400">No users yet.</p>
      ) : (
        <div className="space-y-4">
          {allUsers.map((user) => (
            <div
              key={user.id}
              className="border border-gray-100 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ID: {user.id} &middot; Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="set-role" />
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    onChange={(e) => e.target.form?.requestSubmit()}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </fetcher.Form>
              </div>

              {/* Enrollments */}
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => {
                  const isEnrolled = user.enrollments.includes(course.slug);
                  return (
                    <fetcher.Form method="post" key={course.slug}>
                      <input
                        type="hidden"
                        name="intent"
                        value={isEnrolled ? "unenroll" : "enroll"}
                      />
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="courseSlug"
                        value={course.slug}
                      />
                      <button
                        type="submit"
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          isEnrolled
                            ? "bg-brand-violet-50 text-brand-violet hover:bg-red-50 hover:text-red-500"
                            : "bg-gray-100 text-gray-400 hover:bg-brand-violet-50 hover:text-brand-violet"
                        }`}
                      >
                        {isEnrolled ? "✓ " : "+ "}
                        {course.title}
                      </button>
                    </fetcher.Form>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
