import { Link } from "react-router";
import type { Route } from "./+types/admin.courses";
import { getCourses } from "~/lib/courses.server";
import { db } from "~/db";
import { enrollments } from "~/db/schema";
import { eq, count } from "drizzle-orm";

export function meta() {
  return [{ title: "Courses — Admin — Hatch" }];
}

export async function loader() {
  const courses = getCourses();

  const coursesWithStats = await Promise.all(
    courses.map(async (course) => {
      const [enrollmentCount] = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.courseSlug, course.slug));

      const lessonCount = course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
      );

      return {
        ...course,
        enrollmentCount: enrollmentCount.count,
        lessonCount,
      };
    })
  );

  return { courses: coursesWithStats };
}

export default function AdminCourses({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Courses</h1>

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.slug}
            className="border border-gray-100 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {course.modules.length} modules &middot; {course.lessonCount}{" "}
                  lessons &middot; {course.enrollmentCount} enrolled
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {course.price === 0
                    ? "Free"
                    : `$${course.price.toFixed(2)}`}
                </span>
                <Link
                  to={`/courses/${course.slug}`}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View
                </Link>
              </div>
            </div>

            {/* Module & lesson breakdown */}
            <div className="border-t border-gray-50">
              {course.modules.map((mod, idx) => (
                <div key={mod.slug}>
                  <div className="px-6 py-3 bg-gray-50/50 flex items-center justify-between border-t border-gray-50 first:border-t-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-gray-300">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-gray-700">
                        {mod.title}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                        mod.access === "free" || !mod.access
                          ? "bg-green-50 text-green-600"
                          : mod.access === "account"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {mod.access || "free"}
                    </span>
                  </div>
                  <ul>
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.slug}
                        className="px-6 py-2 flex items-center justify-between border-t border-gray-50"
                      >
                        <span className="text-xs text-gray-500">
                          {lesson.title}
                        </span>
                        <Link
                          to={`/admin/courses/${course.slug}/${mod.slug}/${lesson.slug}`}
                          className="text-[11px] px-2 py-0.5 text-brand-violet hover:text-brand-indigo transition-colors"
                        >
                          Edit
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
