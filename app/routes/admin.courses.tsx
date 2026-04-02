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

            {/* Module breakdown */}
            <div className="border-t border-gray-50 px-6 py-3 bg-gray-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {course.modules.map((mod, idx) => (
                  <div
                    key={mod.slug}
                    className="text-xs text-gray-500 flex items-center gap-1.5"
                  >
                    <span className="text-gray-300">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{mod.title}</span>
                    <span
                      className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
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
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
