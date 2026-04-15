import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { users, enrollments, profiles, creators } from "~/db/schema";

export async function getOrCreateUser(args: LoaderFunctionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) return null;

  const email =
    (auth.sessionClaims?.email as string) ||
    (auth.sessionClaims?.email_address as string) ||
    "";
  const firstName = (auth.sessionClaims?.first_name as string) || "";
  const lastName = (auth.sessionClaims?.last_name as string) || "";

  const existing = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  });

  if (existing) {
    // Sync name from Clerk if it changed (e.g. OAuth profile update)
    if (
      (firstName && existing.firstName !== firstName) ||
      (lastName && existing.lastName !== lastName) ||
      (email && existing.email !== email)
    ) {
      await db
        .update(users)
        .set({
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
        })
        .where(eq(users.id, auth.userId));
      return { ...existing, firstName: firstName || existing.firstName, lastName: lastName || existing.lastName, email: email || existing.email };
    }
    return existing;
  }

  // First visit — create user record
  const [newUser] = await db
    .insert(users)
    .values({ id: auth.userId, email, firstName, lastName })
    .onConflictDoNothing()
    .returning();

  const user = newUser || (await db.query.users.findFirst({ where: eq(users.id, auth.userId) }));

  // Seed profile from Clerk data
  if (user) {
    const displayName = [firstName, lastName].filter(Boolean).join(" ");
    const imageUrl = (auth.sessionClaims?.image_url as string) || "";
    await db
      .insert(profiles)
      .values({
        userId: user.id,
        displayName,
        avatarUrl: imageUrl || null,
      })
      .onConflictDoNothing();
  }

  return user;
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

export async function requireSignedInUser(args: LoaderFunctionArgs) {
  const user = await getOrCreateUser(args);
  if (!user) throw redirect("/");
  return user;
}

export async function requireCreator(args: LoaderFunctionArgs) {
  const user = await requireSignedInUser(args);
  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, user.id),
  });
  if (!creator) throw redirect("/become-a-creator");
  return { user, creator };
}
