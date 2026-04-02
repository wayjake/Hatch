import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("courses/:courseSlug", "routes/course-detail.tsx"),
  route("courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/lesson.tsx"),
  route("teleprompter", "routes/teleprompter.tsx"),

  // API routes
  route("api/enroll", "routes/api.enroll.ts"),

  // Admin routes
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/courses", "routes/admin.courses.tsx"),
  ]),
] satisfies RouteConfig;
