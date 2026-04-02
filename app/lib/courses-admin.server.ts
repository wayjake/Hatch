import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/courses");

export function updateLessonFrontmatter(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  updates: { description?: string }
) {
  const lessonPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    `${lessonSlug}.md`
  );
  if (!fs.existsSync(lessonPath)) return false;

  const raw = fs.readFileSync(lessonPath, "utf-8");
  const { data, content } = matter(raw);

  if (updates.description !== undefined) {
    data.description = updates.description;
  }

  const updated = matter.stringify(content, data);
  fs.writeFileSync(lessonPath, updated, "utf-8");
  return true;
}

export function updateLessonVideo(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  video: { url: string; type: string; thumbnail?: string } | null
) {
  const videosDir = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    "assets",
    "videos"
  );
  const videosJsonPath = path.join(videosDir, "videos.json");

  // Ensure directory exists
  fs.mkdirSync(videosDir, { recursive: true });

  // Load existing
  let videosMap: Record<string, { url: string; type: string; thumbnail?: string }> = {};
  if (fs.existsSync(videosJsonPath)) {
    videosMap = JSON.parse(fs.readFileSync(videosJsonPath, "utf-8"));
  }

  if (video) {
    videosMap[lessonSlug] = video;
  } else {
    delete videosMap[lessonSlug];
  }

  fs.writeFileSync(videosJsonPath, JSON.stringify(videosMap, null, 2) + "\n", "utf-8");
  return true;
}

export function getLessonVideo(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): { url: string; type: string; thumbnail?: string } | null {
  const videosJsonPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    "assets",
    "videos",
    "videos.json"
  );
  if (!fs.existsSync(videosJsonPath)) return null;

  const videosMap = JSON.parse(fs.readFileSync(videosJsonPath, "utf-8"));
  return videosMap[lessonSlug] || null;
}
