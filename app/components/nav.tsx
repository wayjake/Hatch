import { Link, useLocation } from "react-router";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/react-router";
import type { AppUserRole } from "~/lib/auth.server";

export function Nav({
  currentUser,
}: {
  currentUser?: { role: AppUserRole } | null;
}) {
  const location = useLocation();
  const isTeleprompter = location.pathname.startsWith("/teleprompter");
  const isCreatorPage = location.pathname.startsWith("/@");
  const isBookingPage = location.pathname.startsWith("/book/");

  if (isTeleprompter || isCreatorPage || isBookingPage) return null;

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-amber via-brand-coral to-brand-violet rounded-lg flex items-center justify-center group-hover:opacity-90 transition-opacity">
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
        <div className="flex items-center gap-6">
          <Link
            to="/courses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/community"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Community
          </Link>
          <AuthSection role={currentUser?.role} />
        </div>
      </nav>
    </header>
  );
}

function AuthSection({ role }: { role?: AppUserRole }) {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <>
        {role === "creator" && (
          <Link
            to="/admin"
            className="text-sm font-medium text-brand-violet hover:text-brand-indigo transition-colors"
          >
            Admin
          </Link>
        )}
        {role === "admin" && (
          <Link
            to="/super/admin"
            className="text-sm font-medium text-brand-violet hover:text-brand-indigo transition-colors"
          >
            Super Admin
          </Link>
        )}
        <Link
          to="/profile/edit"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Profile
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <SignInButton mode="modal">
        <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </>
  );
}
