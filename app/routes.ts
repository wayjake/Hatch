import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("courses/:courseSlug", "routes/course-detail.tsx"),
  route("courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/lesson.tsx"),
  route("teleprompter", "routes/teleprompter.tsx"),

  // Profile & community routes
  route("profile/edit", "routes/profile.edit.tsx"),
  route("members/:userId", "routes/member.tsx"),
  route("community", "routes/community.tsx"),
  route("community/projects", "routes/community.projects.tsx"),
  route("projects/new", "routes/project.edit.tsx"),

  // API routes
  route("api/enroll", "routes/api.enroll.ts"),
  route("api/uploadthing", "routes/api.uploadthing.ts"),

  // Admin routes
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/courses", "routes/admin.courses.tsx"),
    route("admin/courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/admin.lesson.tsx"),
  ]),
] satisfies RouteConfig;
