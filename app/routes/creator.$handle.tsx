import type { Route } from "./+types/creator.$handle";
import {
  getCreatorBySlug,
  resolveFeaturedCourses,
} from "~/lib/creators.server";
import { CreatorPageTemplate } from "~/components/creator-page-template";

export async function loader({ params }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Not Found", { status: 404 });

  const result = await getCreatorBySlug(handle);
  if (!result || !result.creator.isActive) {
    throw new Response("Not Found", { status: 404 });
  }

  const { creator, leadPage } = result;
  if (!leadPage || leadPage.status !== "published") {
    throw new Response("Not Found", { status: 404 });
  }

  const featuredCourses = resolveFeaturedCourses(
    creator.slug,
    leadPage.parsedFeaturedCourseSlugs
  );

  return { creator, leadPage, featuredCourses };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Not Found" }];
  const { creator, leadPage } = data;
  const title = leadPage.headline
    ? `${leadPage.headline} — ${creator.displayName}`
    : creator.displayName;
  const description = leadPage.subhead || creator.bio || "";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(leadPage.heroImageUrl
      ? [{ property: "og:image", content: leadPage.heroImageUrl }]
      : []),
  ];
}

export default function CreatorPage({ loaderData }: Route.ComponentProps) {
  const { creator, leadPage, featuredCourses } = loaderData;
  return (
    <CreatorPageTemplate
      creator={creator}
      leadPage={leadPage}
      featuredCourses={featuredCourses}
    />
  );
}
