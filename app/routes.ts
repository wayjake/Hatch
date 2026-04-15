import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("courses/:courseSlug", "routes/course-detail.tsx"),
  route("courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/lesson.tsx"),
  route("teleprompter", "routes/teleprompter.tsx"),

  // Creator lead pages
  route("@/:handle", "routes/creator.$handle.tsx"),
  route("creators", "routes/creators.tsx"),
  route("become-a-creator", "routes/become-a-creator.tsx"),

  // Profile & community routes
  route("profile/edit", "routes/profile.edit.tsx"),
  route("members/:userId", "routes/member.tsx"),
  route("community", "routes/community.tsx"),
  route("community/projects", "routes/community.projects.tsx"),
  route("projects/new", "routes/project.edit.tsx"),
  route("account/calls", "routes/account.calls.tsx"),
  route("account/bookings", "routes/account.bookings.tsx"),
  route("book/:slug", "routes/book.$slug.tsx"),

  // API routes
  route("api/enroll", "routes/api.enroll.ts"),
  route("api/uploadthing", "routes/api.uploadthing.ts"),
  route("api/bookings/create", "routes/api.bookings.create.ts"),
  route("api/stripe/checkout", "routes/api.stripe.checkout.ts"),
  route("api/stripe/webhook", "routes/api.stripe.webhook.ts"),

  // Studio — creator admin surface
  layout("routes/studio.tsx", [
    route("studio", "routes/studio.dashboard.tsx"),
    route("studio/page", "routes/studio.page.tsx"),
    route("studio/settings", "routes/studio.settings.tsx"),
  ]),

  // Admin routes
  layout("routes/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/bookings", "routes/admin.bookings.tsx"),
    route("admin/booking-links", "routes/admin.booking-links.tsx"),
    route("admin/availability", "routes/admin.availability.tsx"),
    route("admin/payments", "routes/admin.payments.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/courses", "routes/admin.courses.tsx"),
    route("admin/courses/:courseSlug/:moduleSlug/:lessonSlug", "routes/admin.lesson.tsx"),
  ]),
] satisfies RouteConfig;
