/**
 * Admin layout with protected access.
 *
 * This layout wraps all admin routes (/admin/*).
 * Actual authentication verification happens at the server level.
 */

import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin-specific header/navigation will go here */}
      <main>{children}</main>
    </div>
  );
}
