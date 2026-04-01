import { Link } from "react-router";
import type { Route } from "./+types/lesson";
import { getCourse, getLessonContent } from "~/lib/courses.server";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.lesson) {
    return [{ title: "Lesson Not Found — Hatch" }];
  }
  return [
    { title: `${data.lesson.title} — Hatch` },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const course = getCourse(params.courseSlug);
  if (!course) throw new Response("Course not found", { status: 404 });

  const lesson = getLessonContent(
    params.courseSlug,
    params.moduleSlug,
    params.lessonSlug
  );
  if (!lesson) throw new Response("Lesson not found", { status: 404 });

  // Find current position for prev/next navigation
  const allLessons: { moduleSlug: string; lessonSlug: string; title: string }[] = [];
  for (const mod of course.modules) {
    for (const l of mod.lessons) {
      allLessons.push({ moduleSlug: mod.slug, lessonSlug: l.slug, title: l.title });
    }
  }
  const currentIdx = allLessons.findIndex(
    (l) => l.moduleSlug === params.moduleSlug && l.lessonSlug === params.lessonSlug
  );
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return {
    course: { title: course.title, slug: course.slug },
    lesson,
    prev,
    next,
  };
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const { course, lesson, prev, next } = loaderData;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link to="/courses" className="hover:text-gray-600 transition-colors">
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

      {/* Lesson Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
          <span>{lesson.duration}</span>
          <button className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Mark Complete
          </button>
        </div>
      </div>

      {/* Content */}
      <article
        className="prose prose-gray prose-headings:tracking-tight prose-a:text-amber-600 prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.html }}
      />

      {/* Navigation */}
      <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
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
            className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            {next.title} &rarr;
          </Link>
        ) : (
          <Link
            to={`/courses/${course.slug}`}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Back to Course &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
