import type { Route } from "./+types/api.enroll";
import { getAuth } from "@clerk/react-router/server";
import { db } from "~/db";
import { enrollments } from "~/db/schema";
import { getCourse } from "~/lib/courses.server";

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await args.request.formData();
  const courseSlug = formData.get("courseSlug") as string;

  if (!courseSlug) {
    return new Response("Missing courseSlug", { status: 400 });
  }

  const course = getCourse(courseSlug);
  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  // Only allow self-enrollment for free courses
  // Paid courses require admin enrollment or Stripe integration (future)
  if (course.price > 0) {
    return new Response("Payment required", { status: 402 });
  }

  await db
    .insert(enrollments)
    .values({ userId: auth.userId, courseSlug })
    .onConflictDoNothing();

  return { ok: true };
}
