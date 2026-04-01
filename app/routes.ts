import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("courses/:courseSlug", "routes/course-detail.tsx"),
  route("courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/lesson.tsx"),
  route("teleprompter", "routes/teleprompter.tsx"),
] satisfies RouteConfig;
