import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role", { enum: ["customer", "admin"] })
    .notNull()
    .default("customer"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    courseSlug: text("course_slug").notNull(),
    purchasedAt: integer("purchased_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("enrollment_unique").on(table.userId, table.courseSlug),
  ]
);

export const lessonCompletions = sqliteTable(
  "lesson_completions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    courseSlug: text("course_slug").notNull(),
    moduleSlug: text("module_slug").notNull(),
    lessonSlug: text("lesson_slug").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("completion_unique").on(
      table.userId,
      table.courseSlug,
      table.moduleSlug,
      table.lessonSlug
    ),
  ]
);

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  displayName: text("display_name").notNull().default(""),
  bio: text("bio").notNull().default(""),
  headline: text("headline").notNull().default(""),
  avatarUrl: text("avatar_url"),
  location: text("location").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  githubUrl: text("github_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseSlug: text("course_slug").notNull(),
  moduleSlug: text("module_slug").notNull(),
  lessonSlug: text("lesson_slug").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull().default(""),
  imageUrl: text("image_url"),
  tags: text("tags").notNull().default("[]"), // JSON array of strings
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const commentVotes = sqliteTable(
  "comment_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("vote_unique").on(table.commentId, table.userId),
  ]
);
