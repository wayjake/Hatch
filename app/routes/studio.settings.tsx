import { Form, useActionData, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/studio.settings";
import { db } from "~/db";
import { creators } from "~/db/schema";
import { requireCreator } from "~/lib/auth.server";

export async function loader(args: Route.LoaderArgs) {
  const { creator } = await requireCreator(args);
  return { creator };
}

export async function action(args: Route.ActionArgs) {
  const { creator } = await requireCreator(args);
  const formData = await args.request.formData();

  const displayName = String(formData.get("displayName") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const brandColor = String(formData.get("brandColor") || "#111827").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim();

  if (!displayName) {
    return { error: "Brand name is required." };
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
    return { error: "Brand color must be a hex value like #111827." };
  }

  await db
    .update(creators)
    .set({
      displayName,
      tagline,
      bio,
      brandColor,
      logoUrl: logoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creator.id));

  return { saved: true };
}

export default function StudioSettings({
  loaderData,
}: Route.ComponentProps) {
  const { creator } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Brand settings
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          How your space looks and reads across Hatch.
        </p>
      </div>

      <Form method="post" className="space-y-6">
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Handle
          </div>
          <div className="px-4 py-3 text-sm font-mono text-gray-500 bg-gray-50 rounded-xl ring-1 ring-gray-100">
            @/{creator.slug}
          </div>
          <div className="mt-1.5 text-xs text-gray-500">
            Handles are immutable in v1. Changing one would break client
            links.
          </div>
        </div>

        <TextField
          label="Brand name"
          name="displayName"
          defaultValue={creator.displayName}
          help="Shown as the page header and in the Hatch creator directory."
        />

        <TextField
          label="Tagline"
          name="tagline"
          defaultValue={creator.tagline}
          help="One short line that sits above the About section."
        />

        <TextField
          label="Bio"
          name="bio"
          defaultValue={creator.bio}
          multiline
          rows={4}
          help="Short bio shown in directory listings. Separate from the lead page About."
        />

        <TextField
          label="Logo URL"
          name="logoUrl"
          defaultValue={creator.logoUrl ?? ""}
          help="Paste a square image URL. Shows in the header of your lead page."
        />

        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Brand color
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="brandColor"
              defaultValue={creator.brandColor}
              className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
            />
            <code className="text-sm font-mono text-gray-600">
              {creator.brandColor}
            </code>
          </div>
          <div className="mt-1.5 text-xs text-gray-500">
            Used for your primary button, step numbers, and hero glow.
          </div>
        </div>

        {actionData && "error" in actionData && actionData.error && (
          <div className="text-sm text-red-600">{actionData.error}</div>
        )}
        {actionData && "saved" in actionData && actionData.saved && (
          <div className="text-sm text-emerald-600">Saved.</div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-lg shadow-gray-900/15 hover:bg-gray-800 transition-all disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </Form>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  help,
  multiline,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  help?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const common =
    "w-full px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white rounded-xl ring-1 ring-gray-200 focus:outline-none focus:ring-gray-400";
  return (
    <label className="block">
      <div className="text-sm font-semibold text-gray-800 mb-2">{label}</div>
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows ?? 3}
          className={common}
        />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={defaultValue ?? ""}
          className={common}
        />
      )}
      {help && <div className="mt-1.5 text-xs text-gray-500">{help}</div>}
    </label>
  );
}
