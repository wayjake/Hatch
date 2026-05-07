import { Form, redirect, useActionData } from "react-router";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/become-a-creator";
import { db } from "~/db";
import { creators, leadPages } from "~/db/schema";
import { promoteUserToCreator, requireSignedInUser } from "~/lib/auth.server";
import { validateHandle, normalizeHandle } from "~/lib/reserved-handles";

export function meta() {
  return [
    { title: "Become a creator — Hatch" },
    {
      name: "description",
      content:
        "Claim your space on Hatch. Share your knowledge, build community, and book your time — all under your own brand.",
    },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const user = await requireSignedInUser(args);
  // If they already have a creators row, skip this flow
  const existing = await db.query.creators.findFirst({
    where: eq(creators.userId, user.id),
  });
  if (existing) throw redirect("/studio");
  return { user };
}

interface ActionError {
  handle?: string;
  brandName?: string;
  general?: string;
  values?: { handle: string; brandName: string; tagline: string };
}

export async function action(args: Route.ActionArgs) {
  const user = await requireSignedInUser(args);
  const formData = await args.request.formData();

  const rawHandle = String(formData.get("handle") || "");
  const brandName = String(formData.get("brandName") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();

  const handle = normalizeHandle(rawHandle);
  const values = { handle, brandName, tagline };

  const handleError = validateHandle(rawHandle);
  if (handleError) {
    return { handle: handleError, values } satisfies ActionError;
  }
  if (!brandName) {
    return { brandName: "Brand name is required", values } satisfies ActionError;
  }

  // Check uniqueness
  const taken = await db.query.creators.findFirst({
    where: eq(creators.slug, handle),
  });
  if (taken) {
    return { handle: "That handle is taken", values } satisfies ActionError;
  }

  try {
    const [created] = await db
      .insert(creators)
      .values({
        userId: user.id,
        slug: handle,
        displayName: brandName,
        tagline,
      })
      .returning();

    await db.insert(leadPages).values({
      creatorId: created.id,
    });
    await promoteUserToCreator(user.id);
  } catch (err) {
    return {
      general: "Something went wrong creating your creator account.",
      values,
    } satisfies ActionError;
  }

  throw redirect("/studio/page");
}

export default function BecomeCreator() {
  const actionData = useActionData<typeof action>() as ActionError | undefined;
  const values = actionData?.values;

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="mb-10">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-[0.14em] mb-3">
          Claim your space
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-[1.1]">
          Build your home on Hatch.
        </h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Pick a handle and a name. You'll get a public lead page at{" "}
          <span className="font-mono text-gray-900">hatch/@/your-handle</span>{" "}
          that you can share with clients to show them your courses, community,
          and 1:1 time — all under your own brand.
        </p>
      </div>

      <Form method="post" className="space-y-6">
        <Field
          label="Handle"
          name="handle"
          placeholder="buildwithjake"
          help="Lowercase letters, numbers, and hyphens. 3–32 chars. This is your URL."
          error={actionData?.handle}
          defaultValue={values?.handle}
          required
          prefix="hatch/@/"
        />
        <Field
          label="Brand name"
          name="brandName"
          placeholder="Build with Jake"
          help="How your name appears on your lead page."
          error={actionData?.brandName}
          defaultValue={values?.brandName}
          required
        />
        <Field
          label="Tagline"
          name="tagline"
          placeholder="Helping female founders build SaaS."
          help="A short one-liner. Optional — you can edit later."
          defaultValue={values?.tagline}
        />

        {actionData?.general && (
          <div className="text-sm text-red-600">{actionData.general}</div>
        )}

        <button
          type="submit"
          className="w-full px-6 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-lg shadow-gray-900/15 hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          Claim my space
        </button>
      </Form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  help,
  error,
  defaultValue,
  required,
  prefix,
}: {
  label: string;
  name: string;
  placeholder?: string;
  help?: string;
  error?: string;
  defaultValue?: string;
  required?: boolean;
  prefix?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-gray-800 mb-2">{label}</div>
      <div
        className={`flex items-center rounded-xl ring-1 bg-white transition-colors ${
          error ? "ring-red-300 focus-within:ring-red-400" : "ring-gray-200 focus-within:ring-gray-400"
        }`}
      >
        {prefix && (
          <span className="pl-4 pr-1 text-sm text-gray-400 font-mono">
            {prefix}
          </span>
        )}
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
        />
      </div>
      {error ? (
        <div className="mt-1.5 text-xs text-red-600">{error}</div>
      ) : help ? (
        <div className="mt-1.5 text-xs text-gray-500">{help}</div>
      ) : null}
    </label>
  );
}
