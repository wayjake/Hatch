import { Link, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";

export async function loader(args: Route.LoaderArgs) {
  const user = await requireAdmin(args);
  return { user };
}

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/courses", label: "Courses" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Admin sidebar */}
      <aside className="w-56 bg-gray-50 border-r border-gray-100 shrink-0">
        <div className="px-4 py-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Admin
          </h2>
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
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Admin content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
