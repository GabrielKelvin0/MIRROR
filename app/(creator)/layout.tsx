import { ReactNode } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { requireRole } from "@/lib/auth/session";

/**
 * Creator layout.
 *
 * Server-side authorization: requires an authenticated Clerk session
 * whose local MIRROR User has the CREATOR role. Unauthorized users are
 * redirected by requireRole. This is the security boundary; never rely
 * on client-side guards.
 */
export default async function CreatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("CREATOR");
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-neutral-900">MIRROR Creator</span>
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
