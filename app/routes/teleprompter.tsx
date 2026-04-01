import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/teleprompter";
import { getCourses, getLessonContent } from "~/lib/courses.server";

export function meta() {
  return [{ title: "Teleprompter — Hatch" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const courseSlug = url.searchParams.get("course");
  const moduleSlug = url.searchParams.get("module");
  const lessonSlug = url.searchParams.get("lesson");

  const courses = getCourses();

  let lessonContent: { title: string; raw: string } | null = null;
  if (courseSlug && moduleSlug && lessonSlug) {
    const content = getLessonContent(courseSlug, moduleSlug, lessonSlug);
    if (content) {
      lessonContent = { title: content.title, raw: content.raw };
    }
  }

  return { courses, courseSlug, moduleSlug, lessonSlug, lessonContent };
}

export default function Teleprompter({ loaderData }: Route.ComponentProps) {
  const { courses, courseSlug, moduleSlug, lessonSlug, lessonContent } =
    loaderData;

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(32);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  const scroll = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += speed * 0.5;
    }
    animRef.current = requestAnimationFrame(scroll);
  }, [speed]);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = requestAnimationFrame(scroll);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, scroll]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.code === "ArrowUp") {
        e.preventDefault();
        setSpeed((s) => Math.min(s + 0.5, 10));
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        setSpeed((s) => Math.max(s - 0.5, 0.5));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Selected course for the lesson picker
  const selectedCourse = courses.find((c) => c.slug === courseSlug);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-amber-400 font-semibold text-sm hover:text-amber-300 transition-colors"
          >
            Hatch
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-400">Teleprompter</span>
          {lessonContent && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-sm text-gray-300">
                {lessonContent.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFontSize((s) => Math.max(s - 4, 16))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            A-
          </button>
          <span className="text-xs text-gray-500 w-8 text-center">
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(s + 4, 72))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            A+
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setSpeed((s) => Math.max(s - 0.5, 0.5))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Slower
          </button>
          <span className="text-xs text-gray-500 w-8 text-center">
            {speed}x
          </span>
          <button
            onClick={() => setSpeed((s) => Math.min(s + 0.5, 10))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Faster
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setIsMirrored((m) => !m)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              isMirrored
                ? "bg-amber-600 text-white"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Mirror
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isFullscreen ? "Exit FS" : "Fullscreen"}
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isPlaying
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lesson Picker */}
        <div className="w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Courses
            </h3>
            {courses.map((course) => (
              <div key={course.slug} className="mb-4">
                <p className="text-sm font-medium text-gray-300 mb-2">
                  {course.title}
                </p>
                {course.modules.map((mod) => (
                  <div key={mod.slug} className="mb-2">
                    <p className="text-xs text-gray-500 mb-1 pl-2">
                      {mod.title}
                    </p>
                    {mod.lessons.map((lesson) => {
                      const isActive =
                        course.slug === courseSlug &&
                        mod.slug === moduleSlug &&
                        lesson.slug === lessonSlug;
                      return (
                        <Link
                          key={lesson.slug}
                          to={`/teleprompter?course=${course.slug}&module=${mod.slug}&lesson=${lesson.slug}`}
                          className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                            isActive
                              ? "bg-amber-600/20 text-amber-400"
                              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                          }`}
                        >
                          {lesson.title}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Prompter Display */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{
            transform: isMirrored ? "scaleX(-1)" : undefined,
          }}
        >
          {lessonContent ? (
            <div
              className="max-w-4xl mx-auto px-16 py-24 whitespace-pre-wrap leading-relaxed"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            >
              {lessonContent.raw}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <p className="text-xl mb-2">Select a lesson to begin</p>
                <p className="text-sm">
                  Choose a lesson from the sidebar, then press{" "}
                  <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                    Space
                  </kbd>{" "}
                  to start scrolling
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="text-center py-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-600 shrink-0">
        Space: play/pause &middot; &uarr;/&darr;: adjust speed &middot;
        Currently: {speed}x speed
      </div>
    </div>
  );
}
