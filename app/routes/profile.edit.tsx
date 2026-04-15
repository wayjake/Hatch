import { useState } from "react";
import { Form, useNavigation, redirect } from "react-router";
import type { Route } from "./+types/profile.edit";
import { getAuth } from "@clerk/react-router/server";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { profiles } from "~/db/schema";
import { getOrCreateUser } from "~/lib/auth.server";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "~/lib/uploadthing.server";

const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: "/api/uploadthing",
});

export function meta() {
  return [{ title: "Edit Profile — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw redirect("/");

  await getOrCreateUser(args);

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, auth.userId),
  });

  return {
    profile: profile || {
      userId: auth.userId,
      displayName: "",
      bio: "",
      headline: "",
      avatarUrl: null,
      location: "",
      websiteUrl: "",
      githubUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
    },
  };
}

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw new Response("Unauthorized", { status: 401 });

  const form = await args.request.formData();

  const data = {
    displayName: (form.get("displayName") as string) || "",
    bio: (form.get("bio") as string) || "",
    headline: (form.get("headline") as string) || "",
    avatarUrl: (form.get("avatarUrl") as string) || null,
    location: (form.get("location") as string) || "",
    websiteUrl: (form.get("websiteUrl") as string) || "",
    githubUrl: (form.get("githubUrl") as string) || "",
    twitterUrl: (form.get("twitterUrl") as string) || "",
    linkedinUrl: (form.get("linkedinUrl") as string) || "",
    updatedAt: new Date(),
  };

  await db
    .insert(profiles)
    .values({ userId: auth.userId, ...data })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: data,
    });

  return redirect(`/members/${auth.userId}`);
}

export default function EditProfile({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("profileAvatar", {
    onUploadBegin: () => setUploading(true),
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setAvatarUrl(res[0].ufsUrl);
      }
      setUploading(false);
    },
    onUploadError: () => setUploading(false),
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>

      <Form method="post" className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) startUpload([file]);
                  };
                  input.click();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Change Photo"}
              </button>
            </div>
          </div>
          <input type="hidden" name="avatarUrl" value={avatarUrl} />
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
            placeholder="Your name"
          />
        </div>

        {/* Headline */}
        <div>
          <label
            htmlFor="headline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Headline
          </label>
          <input
            type="text"
            id="headline"
            name="headline"
            defaultValue={profile.headline}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
            placeholder="e.g. Building my first SaaS with Hatch"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={profile.bio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet resize-none"
            placeholder="Tell the community a bit about yourself..."
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            defaultValue={profile.location}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
            placeholder="e.g. Austin, TX"
          />
        </div>

        {/* Links */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700">Links</legend>

          <div>
            <label
              htmlFor="websiteUrl"
              className="block text-xs text-gray-500 mb-1"
            >
              Website
            </label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              defaultValue={profile.websiteUrl}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
              placeholder="https://yoursite.com"
            />
          </div>

          <div>
            <label
              htmlFor="githubUrl"
              className="block text-xs text-gray-500 mb-1"
            >
              GitHub
            </label>
            <input
              type="url"
              id="githubUrl"
              name="githubUrl"
              defaultValue={profile.githubUrl}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
              placeholder="https://github.com/username"
            />
          </div>

          <div>
            <label
              htmlFor="twitterUrl"
              className="block text-xs text-gray-500 mb-1"
            >
              Twitter / X
            </label>
            <input
              type="url"
              id="twitterUrl"
              name="twitterUrl"
              defaultValue={profile.twitterUrl}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
              placeholder="https://x.com/username"
            />
          </div>

          <div>
            <label
              htmlFor="linkedinUrl"
              className="block text-xs text-gray-500 mb-1"
            >
              LinkedIn
            </label>
            <input
              type="url"
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={profile.linkedinUrl}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </fieldset>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </Form>
    </div>
  );
}
