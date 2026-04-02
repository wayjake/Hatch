import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { users, enrollments } from "~/db/schema";

export async function getOrCreateUser(args: LoaderFunctionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });

  if (existing) return existing;

  // First visit — create user record
  // Clerk's session claims include email
  const email =
    (auth.sessionClaims?.email as string) ||
    (auth.sessionClaims?.email_address as string) ||
    "";

  const [newUser] = await db
    .insert(users)
    .values({ id: auth.userId, email })
    .onConflictDoNothing()
    .returning();

  return newUser || (await db.query.users.findFirst({ where: eq(users.id, auth.userId) }));
}

export async function checkModuleAccess(
  args: LoaderFunctionArgs,
  courseSlug: string,
  moduleAccess: "free" | "account" | "purchased" | undefined
): Promise<{ allowed: boolean; reason?: "auth" | "purchase"; userId?: string }> {
  const access = moduleAccess || "free";

  if (access === "free") return { allowed: true };

  const auth = await getAuth(args);
  if (!auth.userId) return { allowed: false, reason: "auth" };

  if (access === "account") return { allowed: true, userId: auth.userId };

  // "purchased" — check enrollment
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, auth.userId),
      eq(enrollments.courseSlug, courseSlug)
    ),
  });

  if (enrollment) return { allowed: true, userId: auth.userId };

  // Admins always have access
  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });
  if (user?.role === "admin") return { allowed: true, userId: auth.userId };

  return { allowed: false, reason: "purchase", userId: auth.userId };
}

export async function requireAdmin(args: LoaderFunctionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw new Response("Unauthorized", { status: 401 });

  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });

  if (!user || user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}

export async function getAuthUserId(args: LoaderFunctionArgs): Promise<string | null> {
  const auth = await getAuth(args);
  return auth.userId;
}
