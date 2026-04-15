import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  stripeCustomerId: text("stripe_customer_id"),
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

export const creators = sqliteTable(
  "creators",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull().default(""),
    tagline: text("tagline").notNull().default(""),
    brandColor: text("brand_color").notNull().default("#111827"),
    logoUrl: text("logo_url"),
    hideHatchFooter: integer("hide_hatch_footer", { mode: "boolean" })
      .notNull()
      .default(false),
    timezone: text("timezone").notNull().default("America/Los_Angeles"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("creators_slug_unique").on(table.slug),
    uniqueIndex("creators_user_id_unique").on(table.userId),
  ]
);

export const creatorIntegrations = sqliteTable(
  "creator_integrations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    type: text("type", {
      enum: ["google_calendar", "stripe_connect", "telegram"],
    }).notNull(),
    status: text("status", {
      enum: ["disconnected", "pending", "active", "error"],
    })
      .notNull()
      .default("pending"),
    externalAccountId: text("external_account_id"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    metadata: text("metadata").notNull().default("{}"),
    connectedAt: integer("connected_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("creator_integrations_creator_type_unique").on(
      table.creatorId,
      table.type
    ),
  ]
);

export const offers = sqliteTable(
  "offers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: text("type", {
      enum: ["session_single", "session_pack", "course"],
    }).notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    sessionCreditCount: integer("session_credit_count").notNull().default(0),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("offers_creator_slug_unique").on(table.creatorId, table.slug),
    index("offers_creator_idx").on(table.creatorId),
  ]
);

export const bookingLinks = sqliteTable(
  "booking_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    minimumNoticeHours: integer("minimum_notice_hours").notNull().default(24),
    bookingHorizonDays: integer("booking_horizon_days").notNull().default(60),
    maxBookingsPerDay: integer("max_bookings_per_day"),
    requiresPayment: integer("requires_payment", { mode: "boolean" })
      .notNull()
      .default(true),
    allowedOfferTypes: text("allowed_offer_types").notNull().default("[]"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("booking_links_slug_unique").on(table.slug),
    index("booking_links_creator_idx").on(table.creatorId),
  ]
);

export const availabilityRules = sqliteTable(
  "availability_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bookingLinkId: integer("booking_link_id")
      .notNull()
      .references(() => bookingLinks.id),
    weekday: integer("weekday").notNull(),
    startMinuteOfDay: integer("start_minute_of_day").notNull(),
    endMinuteOfDay: integer("end_minute_of_day").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("availability_rules_booking_link_idx").on(table.bookingLinkId)]
);

export const availabilityOverrides = sqliteTable(
  "availability_overrides",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bookingLinkId: integer("booking_link_id")
      .notNull()
      .references(() => bookingLinks.id),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    isAvailable: integer("is_available", { mode: "boolean" })
      .notNull()
      .default(false),
    note: text("note").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("availability_overrides_booking_link_idx").on(table.bookingLinkId)]
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    status: text("status", {
      enum: ["pending", "paid", "refunded", "failed", "canceled"],
    })
      .notNull()
      .default("pending"),
    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    applicationFeeCents: integer("application_fee_cents").notNull().default(0),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    stripeTransferId: text("stripe_transfer_id"),
    couponCode: text("coupon_code"),
    metadata: text("metadata").notNull().default("{}"),
    purchasedAt: integer("purchased_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("purchases_user_idx").on(table.userId),
    index("purchases_creator_idx").on(table.creatorId),
    uniqueIndex("purchases_checkout_session_unique").on(table.stripeCheckoutSessionId),
  ]
);

export const purchaseItems = sqliteTable(
  "purchase_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offers.id),
    titleSnapshot: text("title_snapshot").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmountCents: integer("unit_amount_cents").notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    sessionCreditsGranted: integer("session_credits_granted").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("purchase_items_purchase_idx").on(table.purchaseId),
    index("purchase_items_offer_idx").on(table.offerId),
  ]
);

export const callCreditTransactions = sqliteTable(
  "call_credit_transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    purchaseId: integer("purchase_id").references(() => purchases.id),
    bookingId: integer("booking_id"),
    type: text("type", {
      enum: ["grant", "consume", "refund", "adjustment", "expire"],
    }).notNull(),
    quantity: integer("quantity").notNull(),
    note: text("note").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("call_credit_transactions_user_idx").on(table.userId),
    index("call_credit_transactions_creator_idx").on(table.creatorId),
  ]
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bookingLinkId: integer("booking_link_id")
      .notNull()
      .references(() => bookingLinks.id),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    userId: text("user_id").references(() => users.id),
    purchaseId: integer("purchase_id").references(() => purchases.id),
    status: text("status", {
      enum: ["pending", "confirmed", "completed", "canceled", "rescheduled"],
    })
      .notNull()
      .default("pending"),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    timezone: text("timezone").notNull(),
    attendeeName: text("attendee_name").notNull().default(""),
    attendeeEmail: text("attendee_email").notNull(),
    notes: text("notes").notNull().default(""),
    googleCalendarEventId: text("google_calendar_event_id"),
    telegramMessageId: text("telegram_message_id"),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("bookings_creator_idx").on(table.creatorId),
    index("bookings_user_idx").on(table.userId),
    index("bookings_starts_at_idx").on(table.startsAt),
  ]
);

export const leadPages = sqliteTable(
  "lead_pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => creators.id),
    headline: text("headline").notNull().default(""),
    subhead: text("subhead").notNull().default(""),
    heroImageUrl: text("hero_image_url"),
    about: text("about").notNull().default(""),
    steps: text("steps").notNull().default("[]"), // JSON: [{title, description}]
    testimonials: text("testimonials").notNull().default("[]"), // JSON: [{quote, author, role}]
    featuredCourseSlugs: text("featured_course_slugs").notNull().default("[]"), // JSON: string[]
    ctaLabel: text("cta_label").notNull().default(""),
    ctaUrl: text("cta_url").notNull().default(""),
    stakesLine: text("stakes_line").notNull().default(""),
    emailCaptureEnabled: integer("email_capture_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("lead_pages_creator_unique").on(table.creatorId)]
);
