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
  status: string;
  modules: Module[];
}

export interface LessonVideo {
  url: string;
  type: string;
  thumbnail?: string;
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

export function getLessonContent(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
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

  const html = marked(contentWithoutDuplicateH1) as string;

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
