import { useState } from "react";
import { Form, Link, useNavigation, redirect } from "react-router";
import type { Route } from "./+types/project.edit";
import { getAuth } from "@clerk/react-router/server";
import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "~/lib/uploadthing.server";

const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: "/api/uploadthing",
});

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.project
        ? `Edit ${data.project.title} — Hatch`
        : "New Project — Hatch",
    },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw redirect("/");

  const url = new URL(args.request.url);
  const projectId = url.searchParams.get("id");

  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, Number(projectId)),
        eq(projects.userId, auth.userId)
      ),
    });
    if (!project) throw new Response("Project not found", { status: 404 });
    return { project, userId: auth.userId };
  }

  return { project: null, userId: auth.userId };
}

export async function action(args: Route.ActionArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) throw new Response("Unauthorized", { status: 401 });

  const form = await args.request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    const projectId = Number(form.get("projectId"));
    await db
      .delete(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, auth.userId))
      );
    return redirect(`/members/${auth.userId}`);
  }

  const title = (form.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const data = {
    title,
    description: (form.get("description") as string) || "",
    url: (form.get("url") as string) || "",
    imageUrl: (form.get("imageUrl") as string) || null,
    tags: form.get("tags") as string || "[]",
  };

  const projectId = form.get("projectId") as string;

  if (projectId) {
    await db
      .update(projects)
      .set(data)
      .where(
        and(
          eq(projects.id, Number(projectId)),
          eq(projects.userId, auth.userId)
        )
      );
  } else {
    await db.insert(projects).values({
      userId: auth.userId,
      ...data,
    });
  }

  return redirect(`/members/${auth.userId}`);
}

export default function EditProject({ loaderData }: Route.ComponentProps) {
  const { project, userId } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [imageUrl, setImageUrl] = useState(project?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    project?.tags ? JSON.parse(project.tags) : []
  );

  const { startUpload } = useUploadThing("projectImage", {
    onUploadBegin: () => setUploading(true),
    onClientUploadComplete: (res) => {
      if (res?.[0]) setImageUrl(res[0].ufsUrl);
      setUploading(false);
    },
    onUploadError: () => setUploading(false),
  });

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {project ? "Edit Project" : "Add Project"}
        </h1>
        <Link
          to={`/members/${userId}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <Form method="post" className="space-y-6">
        {project && (
          <input type="hidden" name="projectId" value={project.id} />
        )}
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="tags" value={JSON.stringify(tags)} />

        {/* Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Screenshot
          </label>
          <div
            className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-gray-300 transition-colors"
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
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Project screenshot"
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="mt-2 text-sm">
                  {uploading ? "Uploading..." : "Click to upload a screenshot"}
                </span>
              </div>
            )}
            {uploading && imageUrl && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Project Name
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={project?.title || ""}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
            placeholder="My Awesome SaaS"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={project?.description || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet resize-none"
            placeholder="What does your project do? What did you learn building it?"
          />
        </div>

        {/* URL */}
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Project URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            defaultValue={project?.url || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
            placeholder="https://myproject.com"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tech Stack
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-violet-50 text-brand-violet text-xs font-medium rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-brand-indigo"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/20 focus:border-brand-violet"
              placeholder="e.g. React, Tailwind, Turso"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={isSubmitting || uploading}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : project ? "Save Changes" : "Add Project"}
          </button>

          {project && (
            <button
              type="submit"
              name="intent"
              value="delete"
              className="px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              onClick={(e) => {
                if (!confirm("Delete this project?")) e.preventDefault();
              }}
            >
              Delete
            </button>
          )}
        </div>
      </Form>
    </div>
  );
}
