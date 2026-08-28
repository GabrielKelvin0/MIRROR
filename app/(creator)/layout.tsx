/**
 * Creator layout with protected access.
 *
 * This layout wraps all creator routes (/creator/*).
 * Actual authentication verification happens at the server level.
 */

import { ReactNode } from "react";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Creator-specific header/navigation will go here */}
      <main>{children}</main>
    </div>
  );
}
