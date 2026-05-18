import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/teleprompter";
import {
  getCourseScriptTree,
  getCourses,
  getLessonScript,
} from "~/lib/courses.server";
import { requireCreatorAdmin } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Teleprompter — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  await requireCreatorAdmin(args);

  const url = new URL(args.request.url);
  const courseSlug = url.searchParams.get("course");
  const moduleSlug = url.searchParams.get("module");
  const lessonSlug = url.searchParams.get("lesson");

  const courseChoices = getCourses().map((c) => ({
    slug: c.slug,
    title: c.title,
  }));

  const selectedCourse = courseSlug ? getCourseScriptTree(courseSlug) : null;

  let lessonContent: { title: string; raw: string } | null = null;
  if (courseSlug && moduleSlug && lessonSlug) {
    lessonContent = getLessonScript(courseSlug, moduleSlug, lessonSlug);
  }

  return {
    courseChoices,
    selectedCourse,
    courseSlug,
    moduleSlug,
    lessonSlug,
    lessonContent,
    obs: {
      url: process.env.OBS_WS_URL || "ws://localhost:4455",
      password: process.env.OBS_WS_PASSWORD || "",
    },
  };
}

type ObsClient = {
  call: (req: string, args?: Record<string, unknown>) => Promise<unknown>;
  disconnect: () => Promise<void>;
};

const RECORD_LEAD_IN_MS = 500;
const SETTINGS_STORAGE_KEY = "teleprompter:settings";

function takeStorageKey(courseSlug: string, moduleSlug: string, lessonSlug: string) {
  return `teleprompter:take:${courseSlug}/${moduleSlug}/${lessonSlug}`;
}

type StoredSettings = {
  speed: number;
  fontSize: number;
  isMirrored: boolean;
  isSidebarOpen: boolean;
};

function loadStoredSettings(): Partial<StoredSettings> {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default function Teleprompter({ loaderData }: Route.ComponentProps) {
  const {
    courseChoices,
    selectedCourse,
    courseSlug,
    moduleSlug,
    lessonSlug,
    lessonContent,
    obs: obsConfig,
  } = loaderData;

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(72);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [nextTake, setNextTake] = useState(1);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const obsRef = useRef<ObsClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  // Hydrate persisted prompter settings from localStorage after mount so the
  // server-rendered defaults match the first client render.
  useEffect(() => {
    const stored = loadStoredSettings();
    if (typeof stored.speed === "number" && stored.speed > 0) {
      setSpeed(stored.speed);
    }
    if (typeof stored.fontSize === "number" && stored.fontSize > 0) {
      setFontSize(stored.fontSize);
    }
    if (typeof stored.isMirrored === "boolean") {
      setIsMirrored(stored.isMirrored);
    }
    if (typeof stored.isSidebarOpen === "boolean") {
      setIsSidebarOpen(stored.isSidebarOpen);
    }
    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    try {
      const payload: StoredSettings = { speed, fontSize, isMirrored, isSidebarOpen };
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage may be unavailable (private mode, quota); ignore.
    }
  }, [settingsHydrated, speed, fontSize, isMirrored, isSidebarOpen]);

  // Load the next take number from localStorage whenever the lesson changes.
  useEffect(() => {
    if (!courseSlug || !moduleSlug || !lessonSlug) {
      setNextTake(1);
      return;
    }
    const stored = Number(
      localStorage.getItem(takeStorageKey(courseSlug, moduleSlug, lessonSlug))
    );
    setNextTake(Number.isFinite(stored) && stored > 0 ? stored + 1 : 1);
  }, [courseSlug, moduleSlug, lessonSlug]);

  const getObs = useCallback(async (): Promise<ObsClient> => {
    if (obsRef.current) return obsRef.current;
    // Dynamic import keeps obs-websocket-js out of the server bundle.
    const mod = await import("obs-websocket-js");
    const OBSWebSocket = (mod as { default: new () => ObsClient & { connect: (url: string, password: string) => Promise<unknown> } }).default;
    const obs = new OBSWebSocket();
    await obs.connect(obsConfig.url, obsConfig.password);
    obsRef.current = obs;
    return obs;
  }, [obsConfig.url, obsConfig.password]);

  // Disconnect from OBS on unmount.
  useEffect(() => {
    return () => {
      const obs = obsRef.current;
      obsRef.current = null;
      if (obs) {
        obs.disconnect().catch(() => {});
      }
    };
  }, []);

  const handleRecord = useCallback(async () => {
    if (!courseSlug || !moduleSlug || !lessonSlug) {
      setRecordError("Pick a lesson first.");
      return;
    }
    setRecordError(null);

    if (isRecording) {
      try {
        const obs = await getObs();
        await obs.call("StopRecord");
      } catch (e) {
        setRecordError(e instanceof Error ? e.message : "Failed to stop OBS recording");
      }
      setIsPlaying(false);
      setIsRecording(false);
      // Persist the take we just used so the next press increments.
      localStorage.setItem(
        takeStorageKey(courseSlug, moduleSlug, lessonSlug),
        String(nextTake)
      );
      setNextTake((n) => n + 1);
      return;
    }

    try {
      const obs = await getObs();
      const status = (await obs.call("GetRecordStatus")) as { outputActive?: boolean };
      if (status.outputActive) {
        throw new Error("OBS is already recording — stop it first.");
      }
      const filename = `${lessonSlug}-take-${nextTake}`;
      await obs.call("SetProfileParameter", {
        parameterCategory: "Output",
        parameterName: "FilenameFormatting",
        parameterValue: filename,
      });
      await obs.call("StartRecord");
      setIsRecording(true);
      // Brief lead-in so OBS encoder has spun up before the first words scroll.
      window.setTimeout(() => setIsPlaying(true), RECORD_LEAD_IN_MS);
    } catch (e) {
      setRecordError(e instanceof Error ? e.message : "Failed to start OBS recording");
    }
  }, [courseSlug, moduleSlug, lessonSlug, isRecording, nextTake, getObs]);

  const scroll = useCallback(() => {
    if (scrollRef.current) {
      accumulatorRef.current += speed * 0.5;
      if (accumulatorRef.current >= 1) {
        const px = Math.floor(accumulatorRef.current);
        scrollRef.current.scrollTop += px;
        accumulatorRef.current -= px;
      }
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
        setSpeed((s) => {
          const step = s < 1 ? 0.1 : 0.5;
          return Math.min(Math.round((s + step) * 10) / 10, 10);
        });
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        setSpeed((s) => {
          const step = s <= 1 ? 0.1 : 0.5;
          return Math.max(Math.round((s - step) * 10) / 10, 0.1);
        });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    function handleChange() {
      const entering = Boolean(document.fullscreenElement);
      setIsFullscreen(entering);
      setIsSidebarOpen(!entering);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setIsSidebarOpen((s) => !s)}
            className="p-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setFontSize((s) => Math.max(s - 8, 16))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            A-
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(s + 8, 200))}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            A+
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setSpeed((s) => {
              const step = s <= 1 ? 0.1 : 0.5;
              return Math.max(Math.round((s - step) * 10) / 10, 0.1);
            })}
            className="px-2 py-1 text-xs bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Slower
          </button>
          <span className="text-xs text-gray-500 w-8 text-center">
            {speed}x
          </span>
          <button
            onClick={() => setSpeed((s) => {
              const step = s < 1 ? 0.1 : 0.5;
              return Math.min(Math.round((s + step) * 10) / 10, 10);
            })}
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
          <button
            onClick={handleRecord}
            disabled={!lessonSlug}
            className={`flex items-center justify-center p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            title={
              lessonSlug
                ? isRecording
                  ? "Stop OBS recording"
                  : `Start OBS recording (${lessonSlug}-take-${nextTake})`
                : "Pick a lesson to enable recording"
            }
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <span
              className={`block w-3 h-3 rounded-full ${
                isRecording ? "bg-white animate-pulse" : "bg-red-500"
              }`}
            />
          </button>
      </div>
      {recordError && (
        <div className="px-6 py-2 bg-red-950/60 border-b border-red-900/60 text-xs text-red-200 flex items-center justify-between shrink-0">
          <span>OBS: {recordError}</span>
          <button
            onClick={() => setRecordError(null)}
            className="text-red-300 hover:text-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lesson Picker */}
        <div
          className={`${
            isSidebarOpen ? "w-72" : "w-0"
          } bg-gray-900 border-r border-gray-800 overflow-y-auto shrink-0 transition-all`}
        >
          <div className="p-4">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-300">
                    {selectedCourse.title}
                  </p>
                  <Link
                    to="/teleprompter"
                    className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    Change
                  </Link>
                </div>
                {selectedCourse.modules.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-4">
                    No scripts yet. Create a{" "}
                    <code className="text-gray-400">.script.md</code> file next
                    to a lesson to see it here.
                  </p>
                ) : (
                  selectedCourse.modules.map((mod) => (
                    <div key={mod.slug} className="mb-3">
                      <p className="text-xs text-gray-500 mb-1 pl-2">
                        {mod.title}
                      </p>
                      {mod.lessons.map((lesson) => {
                        const isActive =
                          mod.slug === moduleSlug &&
                          lesson.slug === lessonSlug;
                        return (
                          <Link
                            key={lesson.slug}
                            to={`/teleprompter?course=${selectedCourse.slug}&module=${mod.slug}&lesson=${lesson.slug}`}
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
                  ))
                )}
              </>
            ) : (
              <>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Choose a course
                </h3>
                {courseChoices.map((course) => (
                  <Link
                    key={course.slug}
                    to={`/teleprompter?course=${course.slug}`}
                    className="block text-sm px-3 py-2 rounded-lg text-gray-300 hover:text-amber-400 hover:bg-gray-800 transition-colors"
                  >
                    {course.title}
                  </Link>
                ))}
              </>
            )}
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
              className="max-w-4xl mx-auto px-16 py-24"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.25 }}
            >
              {lessonContent.raw
                .split(/\n\s*\n/)
                .map((para, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-wrap"
                    style={{ marginBottom: `${fontSize * 0.5}px` }}
                  >
                    {para.trim()}
                  </p>
                ))}
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
