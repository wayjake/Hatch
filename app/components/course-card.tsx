import { Link } from "react-router";
import { useState } from "react";
import type { Course } from "~/lib/courses.server";

export function CourseCard({ course }: { course: Course }) {
  const [hovered, setHovered] = useState(false);

  const lessonCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  return (
    <Link
      to={`/courses/${course.slug}`}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: hovered ? "#eef3fb" : "#ffffff",
          border: "2px solid",
          borderColor: hovered
            ? "#0a246a #d4d0c8 #d4d0c8 #0a246a"
            : "#ffffff #808080 #808080 #ffffff",
          fontFamily: "Tahoma, Arial, sans-serif",
          cursor: "pointer",
          transition: "background 0.05s",
        }}
      >
        {/* Icon header area — classic Windows folder look */}
        <div
          style={{
            background: hovered
              ? "linear-gradient(to bottom, #2462c8, #1a3ea0)"
              : "linear-gradient(to bottom, #0a246a, #3a6ea5)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Classic floppy/book icon using text */}
          <span style={{ fontSize: "28px", lineHeight: 1 }}>📖</span>
          <div>
            <div
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "12px",
                lineHeight: "1.3",
              }}
            >
              {course.title}
            </div>
            <div style={{ color: "#b8cfea", fontSize: "10px" }}>
              {course.author || "Hatch Learning"}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "8px 10px" }}>
          <p
            style={{
              fontSize: "11px",
              color: "#333",
              margin: "0 0 8px",
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.description || "No description available."}
          </p>

          {/* Info rows */}
          <div
            style={{
              background: "#d4d0c8",
              border: "1px inset #808080",
              borderColor: "#808080 #ffffff #ffffff #808080",
              padding: "4px 6px",
              fontSize: "10px",
              color: "#333",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span>📁 {course.modules.length} modules</span>
            <span>📄 {lessonCount} lessons</span>
          </div>

          {/* Price button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "2px 12px",
                background: "#d4d0c8",
                border: "2px solid",
                borderColor: "#ffffff #808080 #808080 #ffffff",
                fontSize: "11px",
                fontFamily: "Tahoma, sans-serif",
                fontWeight: "bold",
                color: course.price === 0 ? "#0a246a" : "#8b0000",
                cursor: "pointer",
              }}
            >
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
