import { Link, useLocation } from "react-router";

export function Nav() {
  const location = useLocation();
  const isTeleprompter = location.pathname.startsWith("/teleprompter");

  if (isTeleprompter) return null;

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-900 tracking-tight">
            Hatch
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <Link
            to="/courses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/teleprompter"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Teleprompter
          </Link>
        </div>
      </nav>
    </header>
  );
}
