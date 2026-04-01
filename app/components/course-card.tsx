import { Link } from "react-router";
import type { Course } from "~/lib/courses.server";

export function CourseCard({ course }: { course: Course }) {
  const lessonCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-100 transition-all duration-300"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="w-16 h-16 bg-amber-400/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-amber-600"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {course.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {course.modules.length} modules &middot; {lessonCount} lessons
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {course.price === 0
              ? "Free"
              : `$${course.price.toFixed(2)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
