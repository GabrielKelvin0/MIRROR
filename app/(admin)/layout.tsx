import { ReactNode } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { requireRole } from "@/lib/auth/session";

/**
 * Admin layout.
 *
 * Server-side authorization: requires an authenticated Clerk session
 * whose local MIRROR User has the ADMIN role. Unauthorized users are
 * redirected by requireRole. This is the security boundary; never rely
 * on client-side guards.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="min-h-screen bg-neutral-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:shadow"
      >
        Skip to main content
      </a>
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <span className="font-semibold text-neutral-900">MIRROR Admin</span>
            <nav
              aria-label="Admin"
              className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-600"
            >
              <a href="/admin/dashboard" className="py-2">
                Overview
              </a>
              <a href="/admin/users" className="py-2">
                Users
              </a>
              <a href="/admin/creators" className="py-2">
                Creators
              </a>
              <a href="/admin/strategies" className="py-2">
                Strategies
              </a>
              <a href="/admin/reports" className="py-2">
                Reports
              </a>
              <a href="/admin/audit" className="py-2">
                Audit
              </a>
            </nav>
          </div>
          <SignOutButton>
            <button className="text-sm text-neutral-600 hover:text-neutral-900">Sign out</button>
          </SignOutButton>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
