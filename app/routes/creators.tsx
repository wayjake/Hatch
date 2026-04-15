import { Link } from "react-router";
import type { Route } from "./+types/creators";
import { listPublishedCreators } from "~/lib/creators.server";

export function meta() {
  return [
    { title: "Creators — Hatch" },
    {
      name: "description",
      content:
        "Browse creators building courses, community, and 1:1 sessions on Hatch.",
    },
  ];
}

export async function loader() {
  const creators = await listPublishedCreators();
  return { creators };
}

export default function CreatorsDirectory({
  loaderData,
}: Route.ComponentProps) {
  const { creators } = loaderData;

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-[0.14em] mb-4">
            Creators on Hatch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            Find the creator who sent you here.
          </h1>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Every creator on Hatch runs their own space for courses, community,
            and 1:1 time. Pick yours below.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        {creators.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No creators yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map(({ creator, leadPage }) => {
              const brand = creator.brandColor || "#111827";
              return (
                <Link
                  key={creator.id}
                  to={`/@/${creator.slug}`}
                  className="group block bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {creator.logoUrl ? (
                      <img
                        src={creator.logoUrl}
                        alt={creator.displayName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: brand }}
                      >
                        {creator.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {creator.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        @{creator.slug}
                      </div>
                    </div>
                  </div>
                  {creator.tagline && (
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      {creator.tagline}
                    </p>
                  )}
                  {leadPage.subhead && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {leadPage.subhead}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
