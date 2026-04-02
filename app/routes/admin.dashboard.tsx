import type { Route } from "./+types/admin.dashboard";
import { db } from "~/db";
import { users, enrollments, lessonCompletions } from "~/db/schema";
import { count, desc } from "drizzle-orm";

export function meta() {
  return [{ title: "Admin Dashboard — Hatch" }];
}

export async function loader() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [enrollmentCount] = await db
    .select({ count: count() })
    .from(enrollments);
  const [completionCount] = await db
    .select({ count: count() })
    .from(lessonCompletions);

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

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { stats, recentUsers } = loaderData;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Enrollments" value={stats.enrollments} />
        <StatCard label="Lessons Completed" value={stats.completions} />
      </div>

      {/* Recent Users */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Users
      </h2>
      {recentUsers.length === 0 ? (
        <p className="text-gray-400 text-sm">No users yet.</p>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
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
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === "admin"
                          ? "bg-brand-violet-50 text-brand-violet"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
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
    <div className="bg-white border border-gray-100 rounded-xl px-6 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
