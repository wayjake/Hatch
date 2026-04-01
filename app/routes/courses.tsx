import type { Route } from "./+types/courses";
import { getCourses } from "~/lib/courses.server";
import { CourseCard } from "~/components/course-card";

export function meta() {
  return [
    { title: "Courses — Hatch" },
    { name: "description", content: "Browse all courses on Hatch." },
  ];
}

export function loader() {
  const courses = getCourses();
  return { courses };
}

export default function Courses({ loaderData }: Route.ComponentProps) {
  const { courses } = loaderData;

  return (
    <div style={{ background: "#d4d0c8", minHeight: "calc(100vh - 64px)", fontFamily: "Tahoma, Arial, sans-serif" }}>
      {/* Title bar / toolbar area */}
      <div style={{ background: "linear-gradient(to bottom, #0a246a, #3a6ea5)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <img src="/favicon.ico" alt="" style={{ width: 16, height: 16 }} onError={(e) => (e.currentTarget.style.display = "none")} />
        <span style={{ color: "white", fontWeight: "bold", fontSize: "11px", fontFamily: "Tahoma, sans-serif" }}>
          Hatch Learning Center — Course Catalog
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
          {["_", "□", "✕"].map((ch) => (
            <button key={ch} style={{ width: 16, height: 14, fontSize: "9px", background: "#d4d0c8", border: "1px solid", borderColor: "#ffffff #808080 #808080 #ffffff", cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Menu bar */}
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #808080", padding: "2px 4px", display: "flex", gap: "0", fontSize: "11px", fontFamily: "Tahoma, sans-serif" }}>
        {["File", "Edit", "View", "Favorites", "Tools", "Help"].map((item) => (
          <span key={item} style={{ padding: "2px 6px", cursor: "default" }} onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "#0a246a"; (e.currentTarget as HTMLElement).style.color = "white"; }} onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "black"; }}>
            {item}
          </span>
        ))}
      </div>

      {/* Address bar */}
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #808080", padding: "2px 6px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: "Tahoma, sans-serif" }}>
        <span style={{ fontSize: "11px" }}>Address</span>
        <div style={{ flex: 1, background: "white", border: "2px inset #808080", padding: "1px 4px", fontSize: "11px", borderColor: "#808080 #ffffff #ffffff #808080" }}>
          http://www.hatch.local/courses/catalog.htm
        </div>
        <button style={{ padding: "1px 8px", background: "#d4d0c8", border: "2px solid", borderColor: "#ffffff #808080 #808080 #ffffff", fontSize: "11px", cursor: "default" }}>
          Go
        </button>
      </div>

      {/* Main content */}
      <div style={{ padding: "12px" }}>
        {/* Page header panel */}
        <div style={{ background: "linear-gradient(to right, #0a246a, #3a6ea5)", padding: "8px 12px", marginBottom: "8px", borderRadius: "0" }}>
          <h1 style={{ color: "white", fontWeight: "bold", fontSize: "16px", margin: 0, fontFamily: "Tahoma, sans-serif" }}>
            📚 Course Catalog
          </h1>
          <p style={{ color: "#b8cfea", fontSize: "11px", margin: "2px 0 0", fontFamily: "Tahoma, sans-serif" }}>
            Welcome! Please select a course from the list below to begin learning.
          </p>
        </div>

        {/* Content area with classic raised border */}
        <div style={{ background: "#d4d0c8", border: "2px solid", borderColor: "#808080 #ffffff #ffffff #808080", padding: "8px" }}>
          {courses.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "white", border: "2px inset", borderColor: "#808080 #ffffff #ffffff #808080" }}>
              <p style={{ fontSize: "13px", color: "#333" }}>No courses found.</p>
              <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                Add course content to the <code>content/courses</code> directory.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px" }}>
              {courses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{ marginTop: "8px", background: "#d4d0c8", borderTop: "1px solid #808080", display: "flex", padding: "2px 4px", gap: "8px", fontSize: "11px", fontFamily: "Tahoma, sans-serif", color: "#333" }}>
          <span style={{ flex: 1, borderRight: "1px solid #808080", paddingRight: "8px" }}>
            {courses.length} object(s)
          </span>
          <span style={{ paddingRight: "8px", borderRight: "1px solid #808080" }}>Local intranet</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
