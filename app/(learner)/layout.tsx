/**
 * Learner layout with protected access.
 *
 * This layout wraps all learner routes (/learner/*).
 * Actual authentication verification happens at the server level.
 */

import { ReactNode } from "react";

export default function LearnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Learner-specific header/navigation will go here */}
      <main>{children}</main>
    </div>
  );
}
