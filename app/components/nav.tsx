import { Link, useLocation } from "react-router";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/react-router";

export function Nav() {
  const location = useLocation();
  const isTeleprompter = location.pathname.startsWith("/teleprompter");

  if (isTeleprompter) return null;

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
          <AuthSection />
        </div>
      </nav>
    </header>
  );
}

function AuthSection() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (isSignedIn) {
    const isAdmin =
      (user?.publicMetadata?.role as string) === "admin" ||
      (user?.unsafeMetadata?.role as string) === "admin";

    return (
      <>
        {isAdmin && (
          <Link
            to="/admin"
            className="text-sm font-medium text-brand-violet hover:text-brand-indigo transition-colors"
          >
            Admin
          </Link>
        )}
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
