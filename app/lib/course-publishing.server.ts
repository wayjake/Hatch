import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { marked } from "marked";
import { and, eq, inArray, max } from "drizzle-orm";
import { db } from "~/db";
import { courseRevisions, courses } from "~/db/schema";
import type {
  Course,
  Lesson,
  LessonContent,
  LessonUser,
  LessonVideo,
  Module,
} from "./courses.server";
import { getCourse, getCourses, getLessonContent } from "./courses.server";

const CONTENT_DIR = path.join(process.cwd(), "content/courses");

export interface PublishedLesson extends Lesson {
  description: string;
  markdown: string;
  video: LessonVideo | null;
}

export interface PublishedModule extends Omit<Module, "lessons"> {
  lessons: PublishedLesson[];
}

export interface PublishedCourse extends Omit<Course, "modules"> {
  modules: PublishedModule[];
}

export interface CoursePublishingStatus {
  courseId: number | null;
  publishedRevisionId: number | null;
  publishedVersion: number | null;
  publishedAt: Date | null;
  hasUnpublishedChanges: boolean;
}

function listFilesRecursively(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      return entry.isDirectory()
        ? listFilesRecursively(fullPath)
        : [fullPath];
    })
    .sort((a, b) => a.localeCompare(b));
}

function computeSourceHash(courseSlug: string): string {
  const courseDir = path.join(CONTENT_DIR, courseSlug);
  const hash = createHash("sha256");

  for (const filePath of listFilesRecursively(courseDir)) {
    hash.update(path.relative(courseDir, filePath));
    hash.update("\n");
    hash.update(fs.readFileSync(filePath));
    hash.update("\n");
  }

  return hash.digest("hex");
}

function getVideosForModule(
  courseSlug: string,
  moduleSlug: string
): Record<string, LessonVideo> {
  const videosPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    "assets",
    "videos",
    "videos.json"
  );

  if (!fs.existsSync(videosPath)) return {};
  return JSON.parse(fs.readFileSync(videosPath, "utf-8")) as Record<
    string,
    LessonVideo
  >;
}

function readLessonSnapshot(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  fallbackTitle: string,
  fallbackDuration: string,
  video: LessonVideo | null
): PublishedLesson {
  const lessonPath = path.join(
    CONTENT_DIR,
    courseSlug,
    "modules",
    moduleSlug,
    `${lessonSlug}.md`
  );

  if (!fs.existsSync(lessonPath)) {
    throw new Error(`Missing lesson markdown: ${courseSlug}/${moduleSlug}/${lessonSlug}`);
  }

  const raw = fs.readFileSync(lessonPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    title: String(data.title || fallbackTitle),
    slug: lessonSlug,
    duration: String(data.duration || fallbackDuration),
    description: String(data.description || ""),
    markdown: content,
    video,
  };
}

function applyUserTemplate(markdown: string, user?: LessonUser | null): string {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return markdown
    .replace(/\{\{user\.firstName\}\}/g, user?.firstName || "Your Name")
    .replace(/\{\{user\.lastName\}\}/g, user?.lastName || "")
    .replace(/\{\{user\.name\}\}/g, fullName || "Your Name")
    .replace(/\{\{user\.email\}\}/g, user?.email || "you@example.com");
}

function renderLessonMarkdown(
  title: string,
  markdown: string,
  user?: LessonUser | null
): LessonContent["html"] {
  const h1Match = markdown.match(/^\s*#\s+(.+)\n/);
  const contentWithoutDuplicateH1 =
    h1Match && h1Match[1].trim() === title.trim()
      ? markdown.replace(h1Match[0], "")
      : markdown;

  return marked(applyUserTemplate(contentWithoutDuplicateH1, user)) as string;
}

function toLessonContent(
  lesson: PublishedLesson,
  user?: LessonUser | null
): LessonContent {
  return {
    title: lesson.title,
    description: lesson.description,
    duration: lesson.duration,
    html: renderLessonMarkdown(lesson.title, lesson.markdown, user),
    raw: lesson.markdown,
    video: lesson.video,
  };
}

async function getPublishedRevisionRecord(courseSlug: string) {
  const courseRow = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
  });

  if (!courseRow?.publishedRevisionId) {
    return null;
  }

  const revisionRow = await db.query.courseRevisions.findFirst({
    where: and(
      eq(courseRevisions.id, courseRow.publishedRevisionId),
      eq(courseRevisions.courseId, courseRow.id)
    ),
  });

  if (!revisionRow) {
    return null;
  }

  return { courseRow, revisionRow };
}

export function buildDraftCourseSnapshot(courseSlug: string): PublishedCourse | null {
  const course = getCourse(courseSlug);
  if (!course) return null;

  return {
    ...course,
    modules: course.modules.map((module) => {
      const videos = getVideosForModule(courseSlug, module.slug);

      return {
        ...module,
        lessons: module.lessons.map((lesson) =>
          readLessonSnapshot(
            courseSlug,
            module.slug,
            lesson.slug,
            lesson.title,
            lesson.duration,
            videos[lesson.slug] || null
          )
        ),
      };
    }),
  };
}

export async function getPublishedCourse(
  courseSlug: string
): Promise<PublishedCourse | null> {
  const record = await getPublishedRevisionRecord(courseSlug);
  if (!record) return null;

  return JSON.parse(record.revisionRow.manifestJson) as PublishedCourse;
}

export async function getRuntimeCourse(
  courseSlug: string
): Promise<Course | PublishedCourse | null> {
  return (await getPublishedCourse(courseSlug)) || getCourse(courseSlug);
}

export async function listRuntimeCourses(): Promise<Array<Course | PublishedCourse>> {
  const publishedCourseRows = await db.query.courses.findMany({
    where: eq(courses.status, "published"),
  });
  const revisionIds = publishedCourseRows
    .map((course) => course.publishedRevisionId)
    .filter((value): value is number => typeof value === "number");

  const revisionRows =
    revisionIds.length > 0
      ? await db.query.courseRevisions.findMany({
          where: inArray(courseRevisions.id, revisionIds),
        })
      : [];

  const publishedBySlug = new Map<string, PublishedCourse>();
  for (const courseRow of publishedCourseRows) {
    const revision = revisionRows.find(
      (row) => row.id === courseRow.publishedRevisionId
    );
    if (!revision) continue;

    publishedBySlug.set(
      courseRow.slug,
      JSON.parse(revision.manifestJson) as PublishedCourse
    );
  }

  const draftCourses = getCourses();
  const merged = draftCourses.map(
    (draft) => publishedBySlug.get(draft.slug) || draft
  );

  for (const [slug, publishedCourse] of publishedBySlug) {
    if (!draftCourses.some((draft) => draft.slug === slug)) {
      merged.push(publishedCourse);
    }
  }

  return merged;
}

export async function getRuntimeLessonContent(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  user?: LessonUser | null
): Promise<LessonContent | null> {
  const course = await getPublishedCourse(courseSlug);
  if (!course) {
    return getLessonContent(courseSlug, moduleSlug, lessonSlug, user);
  }

  const module = course.modules.find((item) => item.slug === moduleSlug);
  const lesson = module?.lessons.find((item) => item.slug === lessonSlug);
  if (!lesson) return null;

  return toLessonContent(lesson, user);
}

export async function publishCourseRevision(
  courseSlug: string,
  notes = ""
): Promise<{
  courseId: number;
  revisionId: number;
  version: number;
  sourceHash: string;
  created: boolean;
}> {
  const snapshot = buildDraftCourseSnapshot(courseSlug);
  if (!snapshot) {
    throw new Error(`Course not found: ${courseSlug}`);
  }

  const sourceHash = computeSourceHash(courseSlug);
  const now = new Date();

  return db.transaction(async (tx) => {
    let courseRow = await tx.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
    });

    if (!courseRow) {
      [courseRow] = await tx
        .insert(courses)
        .values({
          slug: courseSlug,
          title: snapshot.title,
          status: "draft",
          currentDraftHash: sourceHash,
          updatedAt: now,
        })
        .returning();
    }

    if (!courseRow) {
      throw new Error(`Unable to create course row for ${courseSlug}`);
    }

    const currentPublishedRevision = courseRow.publishedRevisionId
      ? await tx.query.courseRevisions.findFirst({
          where: eq(courseRevisions.id, courseRow.publishedRevisionId),
        })
      : null;

    if (currentPublishedRevision?.sourceHash === sourceHash) {
      await tx
        .update(courses)
        .set({
          title: snapshot.title,
          status: "published",
          currentDraftHash: sourceHash,
          updatedAt: now,
        })
        .where(eq(courses.id, courseRow.id));

      return {
        courseId: courseRow.id,
        revisionId: currentPublishedRevision.id,
        version: currentPublishedRevision.version,
        sourceHash,
        created: false,
      };
    }

    const [versionRow] = await tx
      .select({ value: max(courseRevisions.version) })
      .from(courseRevisions)
      .where(eq(courseRevisions.courseId, courseRow.id));

    const nextVersion = (versionRow?.value ?? 0) + 1;

    const [revisionRow] = await tx
      .insert(courseRevisions)
      .values({
        courseId: courseRow.id,
        version: nextVersion,
        manifestJson: JSON.stringify(snapshot),
        sourceHash,
        notes,
        publishedAt: now,
      })
      .returning();

    await tx
      .update(courses)
      .set({
        title: snapshot.title,
        status: "published",
        publishedRevisionId: revisionRow.id,
        currentDraftHash: sourceHash,
        updatedAt: now,
      })
      .where(eq(courses.id, courseRow.id));

    return {
      courseId: courseRow.id,
      revisionId: revisionRow.id,
      version: revisionRow.version,
      sourceHash,
      created: true,
    };
  });
}

export async function getCoursePublishingStatus(
  courseSlug: string
): Promise<CoursePublishingStatus> {
  const courseRow = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
  });

  if (!courseRow) {
    return {
      courseId: null,
      publishedRevisionId: null,
      publishedVersion: null,
      publishedAt: null,
      hasUnpublishedChanges: false,
    };
  }

  const publishedRevision = courseRow.publishedRevisionId
    ? await db.query.courseRevisions.findFirst({
        where: eq(courseRevisions.id, courseRow.publishedRevisionId),
      })
    : null;

  const draftExists = Boolean(getCourse(courseSlug));
  const currentHash = draftExists ? computeSourceHash(courseSlug) : null;

  return {
    courseId: courseRow.id,
    publishedRevisionId: courseRow.publishedRevisionId,
    publishedVersion: publishedRevision?.version ?? null,
    publishedAt: publishedRevision?.publishedAt ?? null,
    hasUnpublishedChanges: Boolean(
      draftExists &&
        publishedRevision &&
        publishedRevision.sourceHash !== currentHash
    ),
  };
}
