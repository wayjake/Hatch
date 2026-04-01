import type { Route } from "./+types/courses";
import { getCourses } from "~/lib/courses.server";
import { CourseCard } from "~/components/course-card";

export function meta() {
  return [
    { title: "Courses — Hatch" },
    { name: "description", content: "Browse all courses on Hatch." },
  ];
}

export function loader() {
  const courses = getCourses();
  return { courses };
}

export default function Courses({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
      <p className="text-gray-500 mb-10">
        Explore our library and start learning something new.
      </p>

      {courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No courses yet.</p>
          <p className="text-sm mt-2">
            Add course content to the <code>content/courses</code> directory.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
