import { Form, useActionData, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/studio.page";
import { db } from "~/db";
import { leadPages } from "~/db/schema";
import { requireCreator } from "~/lib/auth.server";
import {
  getCoursesByCreatorHandle,
  parseLeadPage,
} from "~/lib/creators.server";

const STEP_SLOTS = 3;
const TESTIMONIAL_SLOTS = 3;

export async function loader(args: Route.LoaderArgs) {
  const { creator } = await requireCreator(args);
  const row = await db.query.leadPages.findFirst({
    where: eq(leadPages.creatorId, creator.id),
  });
  const leadPage = row ? parseLeadPage(row) : null;
  const ownedCourses = getCoursesByCreatorHandle(creator.slug);
  return { creator, leadPage, ownedCourses };
}

export async function action(args: Route.ActionArgs) {
  const { creator } = await requireCreator(args);
  const formData = await args.request.formData();

  const headline = String(formData.get("headline") || "").trim();
  const subhead = String(formData.get("subhead") || "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") || "").trim();
  const about = String(formData.get("about") || "").trim();
  const ctaLabel = String(formData.get("ctaLabel") || "").trim();
  const ctaUrl = String(formData.get("ctaUrl") || "").trim();
  const stakesLine = String(formData.get("stakesLine") || "").trim();
  const emailCaptureEnabled = formData.get("emailCaptureEnabled") === "on";
  const status =
    formData.get("status") === "published" ? "published" : "draft";

  const steps = Array.from({ length: STEP_SLOTS })
    .map((_, i) => ({
      title: String(formData.get(`steps.${i}.title`) || "").trim(),
      description: String(
        formData.get(`steps.${i}.description`) || ""
      ).trim(),
    }))
    .filter((s) => s.title || s.description);

  const testimonials = Array.from({ length: TESTIMONIAL_SLOTS })
    .map((_, i) => ({
      quote: String(formData.get(`testimonials.${i}.quote`) || "").trim(),
      author: String(formData.get(`testimonials.${i}.author`) || "").trim(),
      role: String(formData.get(`testimonials.${i}.role`) || "").trim(),
    }))
    .filter((t) => t.quote);

  const featuredCourseSlugs = formData.getAll("featuredCourses") as string[];

  if (status === "published" && !headline.trim()) {
    return {
      error: "Add a headline before publishing.",
    };
  }

  await db
    .update(leadPages)
    .set({
      headline,
      subhead,
      heroImageUrl: heroImageUrl || null,
      about,
      steps: JSON.stringify(steps),
      testimonials: JSON.stringify(testimonials),
      featuredCourseSlugs: JSON.stringify(featuredCourseSlugs),
      ctaLabel,
      ctaUrl,
      stakesLine,
      emailCaptureEnabled,
      status,
      updatedAt: new Date(),
    })
    .where(eq(leadPages.creatorId, creator.id));

  return { savedAt: new Date().toISOString() };
}

export default function StudioLeadPage({
  loaderData,
}: Route.ComponentProps) {
  const { creator, leadPage, ownedCourses } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const steps = leadPage?.parsedSteps ?? [];
  const testimonials = leadPage?.parsedTestimonials ?? [];
  const featured = new Set(leadPage?.parsedFeaturedCourseSlugs ?? []);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Lead page
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            This is what clients see at{" "}
            <span className="font-mono text-gray-900">/@/{creator.slug}</span>
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {actionData && "error" in actionData
            ? null
            : actionData && "savedAt" in actionData
            ? "Saved"
            : null}
        </div>
      </div>

      <Form method="post" className="space-y-10">
        <Section title="Hero">
          <Field
            label="Headline"
            name="headline"
            placeholder="Your expertise, in one place."
            defaultValue={leadPage?.headline}
          />
          <Field
            label="Subhead"
            name="subhead"
            placeholder="A one- or two-sentence hook."
            defaultValue={leadPage?.subhead}
            multiline
          />
          <Field
            label="Hero image URL"
            name="heroImageUrl"
            placeholder="https://..."
            defaultValue={leadPage?.heroImageUrl ?? ""}
            help="Optional. Paste a URL to a wide hero image."
          />
        </Section>

        <Section title="About">
          <Field
            label="About you / your work"
            name="about"
            defaultValue={leadPage?.about}
            multiline
            rows={6}
            help="Who you help, what you do, why it matters. Shows as the 'guide' section."
          />
        </Section>

        <Section
          title="How it works"
          subtitle="Three steps clients follow to work with you."
        >
          {Array.from({ length: STEP_SLOTS }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 space-y-3"
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Step {i + 1}
              </div>
              <Field
                label="Title"
                name={`steps.${i}.title`}
                defaultValue={steps[i]?.title}
                compact
              />
              <Field
                label="Description"
                name={`steps.${i}.description`}
                defaultValue={steps[i]?.description}
                multiline
                compact
              />
            </div>
          ))}
        </Section>

        <Section
          title="Call to action"
          subtitle="Your main 'book a call' or 'start here' button. The booking branch will replace the URL with a real booking flow later."
        >
          <Field
            label="Button label"
            name="ctaLabel"
            placeholder="Book a discovery call"
            defaultValue={leadPage?.ctaLabel}
          />
          <Field
            label="Button URL"
            name="ctaUrl"
            placeholder="https://cal.com/your-link"
            defaultValue={leadPage?.ctaUrl}
          />
        </Section>

        <Section title="Featured courses">
          {ownedCourses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No courses linked to your handle yet. Add{" "}
              <code className="font-mono text-gray-800">creatorHandle</code>{" "}
              to a course.json to surface it here.
            </p>
          ) : (
            <div className="space-y-2">
              {ownedCourses.map((course) => (
                <label
                  key={course.slug}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="featuredCourses"
                    value={course.slug}
                    defaultChecked={featured.has(course.slug)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {course.title}
                    </div>
                    <div className="text-xs text-gray-500">{course.slug}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Testimonials"
          subtitle="Optional. Leave blank to hide the section."
        >
          {Array.from({ length: TESTIMONIAL_SLOTS }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 space-y-3"
            >
              <Field
                label="Quote"
                name={`testimonials.${i}.quote`}
                defaultValue={testimonials[i]?.quote}
                multiline
                compact
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Author"
                  name={`testimonials.${i}.author`}
                  defaultValue={testimonials[i]?.author}
                  compact
                />
                <Field
                  label="Role"
                  name={`testimonials.${i}.role`}
                  defaultValue={testimonials[i]?.role ?? ""}
                  compact
                />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Stakes">
          <Field
            label="Stakes line"
            name="stakesLine"
            placeholder="Without a home, your audience forgets where to find you."
            defaultValue={leadPage?.stakesLine}
            help="The one line that names what they miss without you."
          />
        </Section>

        <Section title="Publish">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="emailCaptureEnabled"
                defaultChecked={leadPage?.emailCaptureEnabled ?? false}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Enable email capture section (UI preview only — ESP
                integration is not wired yet)
              </span>
            </label>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">
                Status
              </div>
              <select
                name="status"
                defaultValue={leadPage?.status ?? "draft"}
                className="w-full px-4 py-3 text-sm text-gray-900 bg-white rounded-xl ring-1 ring-gray-200 focus:outline-none focus:ring-gray-400"
              >
                <option value="draft">Draft — only you can see it</option>
                <option value="published">
                  Published — live at /@/{creator.slug}
                </option>
              </select>
            </div>
          </div>
        </Section>

        {actionData && "error" in actionData && actionData.error && (
          <div className="text-sm text-red-600">{actionData.error}</div>
        )}

        <div className="flex items-center gap-3 sticky bottom-6">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-lg shadow-gray-900/15 hover:bg-gray-800 transition-all disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </Form>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  help,
  defaultValue,
  multiline,
  rows,
  compact,
}: {
  label: string;
  name: string;
  placeholder?: string;
  help?: string;
  defaultValue?: string;
  multiline?: boolean;
  rows?: number;
  compact?: boolean;
}) {
  const commonClass =
    "w-full px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white rounded-xl ring-1 ring-gray-200 focus:outline-none focus:ring-gray-400";
  return (
    <label className="block">
      <div
        className={`text-sm font-semibold text-gray-800 mb-2 ${
          compact ? "text-xs" : ""
        }`}
      >
        {label}
      </div>
      {multiline ? (
        <textarea
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue ?? ""}
          rows={rows ?? 3}
          className={commonClass}
        />
      ) : (
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue ?? ""}
          className={commonClass}
        />
      )}
      {help && <div className="mt-1.5 text-xs text-gray-500">{help}</div>}
    </label>
  );
}
