import { count, desc } from "drizzle-orm";
import type { Route } from "./+types/super.admin.dashboard";
import { db } from "~/db";
import { enrollments, lessonCompletions, users } from "~/db/schema";
import { requireAdmin } from "~/lib/auth.server";

export function meta() {
  return [{ title: "Super Admin Dashboard — Hatch" }];
}

export async function loader(args: Route.LoaderArgs) {
  await requireAdmin(args);

  const [userCount] = await db.select({ count: count() }).from(users);
  const [enrollmentCount] = await db.select({ count: count() }).from(enrollments);
  const [completionCount] = await db.select({ count: count() }).from(lessonCompletions);

  const recentUsers = await db.query.users.findMany({
    orderBy: desc(users.createdAt),
    limit: 10,
  });

  return {
    stats: {
      users: userCount.count,
      enrollments: enrollmentCount.count,
      completions: completionCount.count,
    },
    recentUsers,
  };
}

export default function SuperAdminDashboard({ loaderData }: Route.ComponentProps) {
  const { stats, recentUsers } = loaderData;

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Enrollments" value={stats.enrollments} />
        <StatCard label="Lessons Completed" value={stats.completions} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Users</h2>
      {recentUsers.length === 0 ? (
        <p className="text-sm text-gray-400">No users yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-gray-900">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-6 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
