import { Link } from "react-router";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/studio.dashboard";
import { db } from "~/db";
import { leadPages } from "~/db/schema";
import { requireCreator } from "~/lib/auth.server";
import { getCoursesByCreatorHandle } from "~/lib/creators.server";

export async function loader(args: Route.LoaderArgs) {
  const { creator } = await requireCreator(args);
  const leadPage = await db.query.leadPages.findFirst({
    where: eq(leadPages.creatorId, creator.id),
  });
  const ownedCourses = getCoursesByCreatorHandle(creator.slug);
  return { creator, leadPage, ownedCourses };
}

export default function StudioDashboard({
  loaderData,
}: Route.ComponentProps) {
  const { creator, leadPage, ownedCourses } = loaderData;
  const isPublished = leadPage?.status === "published";
  const publicUrl = `/@/${creator.slug}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back, {creator.displayName}.
        </h1>
        <p className="mt-2 text-gray-600">
          Your creator space at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="Lead page"
          value={isPublished ? "Published" : "Draft"}
          valueClass={
            isPublished ? "text-emerald-600" : "text-amber-600"
          }
          action={
            <Link
              to="/studio/page"
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              Edit &rarr;
            </Link>
          }
        />
        <Card
          title="Courses"
          value={`${ownedCourses.length} owned`}
          action={
            <span className="text-xs text-gray-500">
              Filesystem-managed for now
            </span>
          }
        />
      </div>

      <div className="mt-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Your public URL
        </div>
        <div className="flex items-center justify-between gap-4">
          <code className="text-sm font-mono text-gray-900 truncate">
            {publicUrl}
          </code>
          {isPublished ? (
            <Link
              to={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              View &rarr;
            </Link>
          ) : (
            <span className="text-xs text-gray-500">
              Publish to make this live
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  valueClass = "text-gray-900",
  action,
}: {
  title: string;
  value: string;
  valueClass?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-2xl">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="mt-4">{action}</div>
    </div>
  );
}
