import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/studio";
import { requireCreator } from "~/lib/auth.server";

export async function loader(args: Route.LoaderArgs) {
  const { user, creator } = await requireCreator(args);
  return { user, creator };
}

const navItems = [
  { to: "/studio", label: "Dashboard", end: true },
  { to: "/studio/page", label: "Lead Page" },
  { to: "/studio/settings", label: "Brand Settings" },
];

export default function StudioLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const { creator } = loaderData;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-60 bg-gray-50 border-r border-gray-100 shrink-0">
        <div className="px-4 py-6">
          <div className="px-3 mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Studio
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900 truncate">
              {creator.displayName}
            </div>
            <Link
              to={`/@/${creator.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-gray-800 font-mono"
            >
              @/{creator.slug} &rarr;
            </Link>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-white text-gray-900 font-medium shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
