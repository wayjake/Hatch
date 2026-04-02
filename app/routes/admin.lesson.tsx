import { useState } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/admin.lesson";
import { getCourse, getLessonContent } from "~/lib/courses.server";
import {
  getLessonVideo,
  updateLessonFrontmatter,
  updateLessonVideo,
} from "~/lib/courses-admin.server";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "~/lib/uploadthing.server";

const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: "/api/uploadthing",
});

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.lesson
        ? `Edit: ${data.lesson.title} — Admin — Hatch`
        : "Lesson Not Found — Admin — Hatch",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const course = getCourse(params.courseSlug!);
  if (!course) throw new Response("Course not found", { status: 404 });

  const mod = course.modules.find((m) => m.slug === params.moduleSlug);
  if (!mod) throw new Response("Module not found", { status: 404 });

  const lessonMeta = mod.lessons.find((l) => l.slug === params.lessonSlug);
  if (!lessonMeta) throw new Response("Lesson not found", { status: 404 });

  const lesson = getLessonContent(
    params.courseSlug!,
    params.moduleSlug!,
    params.lessonSlug!
  );
  if (!lesson) throw new Response("Lesson not found", { status: 404 });

  const video = getLessonVideo(
    params.courseSlug!,
    params.moduleSlug!,
    params.lessonSlug!
  );

  return {
    course: { title: course.title, slug: course.slug },
    module: { title: mod.title, slug: mod.slug },
    lesson: {
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      slug: params.lessonSlug!,
    },
    video,
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-description") {
    const description = formData.get("description") as string;
    updateLessonFrontmatter(
      params.courseSlug!,
      params.moduleSlug!,
      params.lessonSlug!,
      { description }
    );
    return { ok: true };
  }

  if (intent === "update-video") {
    const url = formData.get("url") as string;
    const type = formData.get("type") as string;
    const thumbnail = formData.get("thumbnail") as string;

    updateLessonVideo(params.courseSlug!, params.moduleSlug!, params.lessonSlug!, {
      url,
      type,
      ...(thumbnail ? { thumbnail } : {}),
    });
    return { ok: true };
  }

  if (intent === "update-thumbnail") {
    const thumbnail = formData.get("thumbnail") as string;
    const video = getLessonVideo(
      params.courseSlug!,
      params.moduleSlug!,
      params.lessonSlug!
    );
    if (video) {
      updateLessonVideo(params.courseSlug!, params.moduleSlug!, params.lessonSlug!, {
        ...video,
        thumbnail,
      });
    }
    return { ok: true };
  }

  if (intent === "remove-video") {
    updateLessonVideo(params.courseSlug!, params.moduleSlug!, params.lessonSlug!, null);
    return { ok: true };
  }

  return { ok: false };
}

export default function AdminLesson({ loaderData }: Route.ComponentProps) {
  const { course, module: mod, lesson, video } = loaderData;
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [description, setDescription] = useState(lesson.description || "");

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin/courses" className="hover:text-gray-600">
          Courses
        </Link>
        <span>/</span>
        <span className="text-gray-600">{course.title}</span>
        <span>/</span>
        <span className="text-gray-600">{mod.title}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{lesson.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{lesson.title}</h1>
      <p className="text-sm text-gray-400 mb-8">{lesson.duration}</p>

      {/* Description */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Description
        </h2>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="update-description" />
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A brief description for SEO and course previews..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Used for meta tags and course previews.
            </p>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save Description
            </button>
          </div>
        </fetcher.Form>
      </section>

      {/* Video */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Lesson Video
        </h2>

        {video ? (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Preview */}
            <div className="bg-black aspect-video">
              <video
                controls
                playsInline
                className="w-full h-full"
                preload="metadata"
                poster={video.thumbnail}
              >
                <source src={video.url} type={video.type} />
              </video>
            </div>
            <div className="p-4 bg-gray-50 space-y-2">
              <p className="text-xs text-gray-500 truncate">
                <span className="font-medium text-gray-700">URL:</span>{" "}
                {video.url}
              </p>
              <div className="flex items-center gap-2">
                <fetcher.Form method="post">
                  <input type="hidden" name="intent" value="remove-video" />
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove Video
                  </button>
                </fetcher.Form>
                <span className="text-gray-300">|</span>
                <VideoUploader
                  label="Replace Video"
                  endpoint="lessonVideo"
                  onComplete={(url, type) => {
                    const form = new FormData();
                    form.set("intent", "update-video");
                    form.set("url", url);
                    form.set("type", type);
                    if (video.thumbnail) form.set("thumbnail", video.thumbnail);
                    fetcher.submit(form, { method: "post" });
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto text-gray-300 mb-3"
            >
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <p className="text-sm text-gray-400 mb-4">No video attached</p>
            <VideoUploader
              label="Upload Video"
              endpoint="lessonVideo"
              onComplete={(url, type) => {
                const form = new FormData();
                form.set("intent", "update-video");
                form.set("url", url);
                form.set("type", type);
                fetcher.submit(form, { method: "post" });
              }}
            />
          </div>
        )}
      </section>

      {/* Thumbnail */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Video Thumbnail
        </h2>

        {video?.thumbnail ? (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <img
              src={video.thumbnail}
              alt="Video thumbnail"
              className="w-full aspect-video object-cover"
            />
            <div className="p-4 bg-gray-50 flex items-center gap-2">
              <ThumbnailUploader
                label="Replace Thumbnail"
                onComplete={(url) => {
                  const form = new FormData();
                  form.set("intent", "update-thumbnail");
                  form.set("thumbnail", url);
                  fetcher.submit(form, { method: "post" });
                }}
              />
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400 mb-4">
              {video
                ? "No thumbnail — the browser will show the first frame."
                : "Upload a video first to add a thumbnail."}
            </p>
            {video && (
              <ThumbnailUploader
                label="Upload Thumbnail"
                onComplete={(url) => {
                  const form = new FormData();
                  form.set("intent", "update-thumbnail");
                  form.set("thumbnail", url);
                  fetcher.submit(form, { method: "post" });
                }}
              />
            )}
          </div>
        )}
      </section>

      {/* View Lesson */}
      <div className="pt-6 border-t border-gray-100">
        <Link
          to={`/courses/${course.slug}/${mod.slug}/${lesson.slug}`}
          className="text-sm text-brand-coral hover:text-brand-rose font-medium transition-colors"
        >
          View lesson &rarr;
        </Link>
      </div>
    </div>
  );
}

function VideoUploader({
  label,
  endpoint,
  onComplete,
}: {
  label: string;
  endpoint: "lessonVideo";
  onComplete: (url: string, type: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { startUpload } = useUploadThing(endpoint, {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setProgress(0);
      if (res?.[0]) {
        onComplete(res[0].ufsUrl, res[0].type);
      }
    },
    onUploadError: (e) => {
      setIsUploading(false);
      setProgress(0);
      alert(`Upload failed: ${e.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    startUpload(Array.from(files));
  };

  if (isUploading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-violet rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>
    );
  }

  return (
    <label className="inline-block px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
      {label}
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}

function ThumbnailUploader({
  label,
  onComplete,
}: {
  label: string;
  onComplete: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { startUpload } = useUploadThing("lessonThumbnail", {
    onUploadProgress: (p) => setProgress(p),
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setProgress(0);
      if (res?.[0]) {
        onComplete(res[0].ufsUrl);
      }
    },
    onUploadError: (e) => {
      setIsUploading(false);
      setProgress(0);
      alert(`Upload failed: ${e.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    startUpload(Array.from(files));
  };

  if (isUploading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-violet rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>
    );
  }

  return (
    <label className="inline-block px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
      {label}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}
