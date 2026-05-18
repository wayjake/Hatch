import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const CONTENT_DIR = path.join(process.cwd(), "content/courses");

export interface Lesson {
  title: string;
  slug: string;
  duration: string;
}

export interface Module {
  title: string;
  slug: string;
  access?: "free" | "account" | "purchased";
  lessons: Lesson[];
}

export interface Course {
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  thumbnail: string;
  author: string;
  creatorHandle?: string;
  status: string;
  modules: Module[];
}

export interface LessonVideo {
  url: string;
  type: string;
  thumbnail?: string;
}

export interface LessonUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}

export interface LessonContent {
  title: string;
  description: string;
  duration: string;
  html: string;
  raw: string;
  video: LessonVideo | null;
}

export function getCourses(): Course[] {
  const courseDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  return courseDirs
    .map((dir) => {
      const coursePath = path.join(CONTENT_DIR, dir.name, "course.json");
      if (!fs.existsSync(coursePath)) return null;
      const data = JSON.parse(fs.readFileSync(coursePath, "utf-8"));
      return data as Course;
    })
    .filter(Boolean) as Course[];
}

export function getCourse(slug: string): Course | null {
  const coursePath = path.join(CONTENT_DIR, slug, "course.json");
  if (!fs.existsSync(coursePath)) return null;
  return JSON.parse(fs.readFileSync(coursePath, "utf-8")) as Course;
}

export function hasLessonScript(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): boolean {
  const scriptPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    `${lessonSlug}.script.md`
  );
  return fs.existsSync(scriptPath);
}

export function getLessonScript(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): { title: string; raw: string } | null {
  const scriptPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    `${lessonSlug}.script.md`
  );
  if (!fs.existsSync(scriptPath)) return null;

  const raw = fs.readFileSync(scriptPath, "utf-8");

  const course = getCourse(courseSlug);
  const module = course?.modules.find((m) => m.slug === moduleSlug);
  const lesson = module?.lessons.find((l) => l.slug === lessonSlug);

  return {
    title: lesson?.title || lessonSlug,
    raw,
  };
}

export function getCourseScriptTree(courseSlug: string): Course | null {
  const course = getCourse(courseSlug);
  if (!course) return null;

  const modules = course.modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) =>
        hasLessonScript(courseSlug, module.slug, lesson.slug)
      ),
    }))
    .filter((module) => module.lessons.length > 0);

  return { ...course, modules };
}

export function getLessonContent(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  user?: LessonUser | null
): LessonContent | null {
  const lessonPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    `${lessonSlug}.md`
  );
  if (!fs.existsSync(lessonPath)) return null;

  const raw = fs.readFileSync(lessonPath, "utf-8");
  const { data, content } = matter(raw);

  // Strip leading h1 if it matches the frontmatter title
  const title = data.title || "";
  const h1Match = content.match(/^\s*#\s+(.+)\n/);
  const contentWithoutDuplicateH1 =
    h1Match && h1Match[1].trim() === title.trim()
      ? content.replace(h1Match[0], "")
      : content;

  // Replace user template variables (e.g. {{user.firstName}})
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const templated = contentWithoutDuplicateH1
    .replace(/\{\{user\.firstName\}\}/g, user?.firstName || "Your Name")
    .replace(/\{\{user\.lastName\}\}/g, user?.lastName || "")
    .replace(/\{\{user\.name\}\}/g, fullName || "Your Name")
    .replace(/\{\{user\.email\}\}/g, user?.email || "you@example.com");

  const html = marked(templated) as string;

  // Look for video reference
  let video: LessonVideo | null = null;
  const videosJsonPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    "assets",
    "videos",
    "videos.json"
  );
  if (fs.existsSync(videosJsonPath)) {
    const videosMap = JSON.parse(fs.readFileSync(videosJsonPath, "utf-8"));
    if (videosMap[lessonSlug]) {
      video = videosMap[lessonSlug] as LessonVideo;
    }
  }

  return {
    title: data.title || "",
    description: data.description || "",
    duration: data.duration || "",
    html,
    raw: content,
    video,
  };
}
