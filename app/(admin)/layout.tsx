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
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4"><span className="font-semibold text-neutral-900">MIRROR Admin</span><nav className="flex gap-3 text-sm text-neutral-600"><a href="/admin/dashboard">Overview</a><a href="/admin/users">Users</a><a href="/admin/creators">Creators</a><a href="/admin/strategies">Strategies</a><a href="/admin/reports">Reports</a></nav></div>
          <SignOutButton>
            <button className="text-sm text-neutral-600 hover:text-neutral-900">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
