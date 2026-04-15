import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { creators, leadPages } from "~/db/schema";
import { getCourses, type Course } from "./courses.server";

export type Creator = typeof creators.$inferSelect;
export type LeadPageRow = typeof leadPages.$inferSelect;

export interface LeadPageStep {
  title: string;
  description: string;
}

export interface LeadPageTestimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface ParsedLeadPage extends LeadPageRow {
  parsedSteps: LeadPageStep[];
  parsedTestimonials: LeadPageTestimonial[];
  parsedFeaturedCourseSlugs: string[];
}

function safeParseArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseLeadPage(row: LeadPageRow): ParsedLeadPage {
  return {
    ...row,
    parsedSteps: safeParseArray<LeadPageStep>(row.steps),
    parsedTestimonials: safeParseArray<LeadPageTestimonial>(row.testimonials),
    parsedFeaturedCourseSlugs: safeParseArray<string>(row.featuredCourseSlugs),
  };
}

export async function getCreatorBySlug(
  slug: string
): Promise<{ creator: Creator; leadPage: ParsedLeadPage | null } | null> {
  const creator = await db.query.creators.findFirst({
    where: eq(creators.slug, slug),
  });
  if (!creator) return null;

  const leadPage = await db.query.leadPages.findFirst({
    where: eq(leadPages.creatorId, creator.id),
  });

  return {
    creator,
    leadPage: leadPage ? parseLeadPage(leadPage) : null,
  };
}

export async function listPublishedCreators(): Promise<
  Array<{ creator: Creator; leadPage: ParsedLeadPage }>
> {
  const rows = await db
    .select({ creator: creators, leadPage: leadPages })
    .from(creators)
    .innerJoin(leadPages, eq(creators.id, leadPages.creatorId))
    .where(and(eq(creators.isActive, true), eq(leadPages.status, "published")));

  return rows.map((row) => ({
    creator: row.creator,
    leadPage: parseLeadPage(row.leadPage),
  }));
}

export function getCoursesByCreatorHandle(handle: string): Course[] {
  return getCourses().filter((course) => course.creatorHandle === handle);
}

export function resolveFeaturedCourses(
  handle: string,
  slugs: string[]
): Course[] {
  const owned = getCoursesByCreatorHandle(handle);
  if (slugs.length === 0) return owned;
  const bySlug = new Map(owned.map((c) => [c.slug, c]));
  return slugs.map((slug) => bySlug.get(slug)).filter((c): c is Course => Boolean(c));
}
