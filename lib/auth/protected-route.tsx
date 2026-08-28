"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "LEARNER" | "CREATOR" | "ADMIN";
  fallback?: ReactNode;
}

/**
 * Client-side component that protects routes from unauthenticated users.
 *
 * WARNING: This is NOT authorization.
 * Server-side verification is required for actual security.
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push("/sign-in");
      return;
    }

    // TODO: Phase 4 - Verify role from database or user metadata
    // This is a placeholder; actual role checking happens server-side
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return fallback || <div>Loading...</div>;
  }

  if (!userId) {
    return fallback || null;
  }

  return <>{children}</>;
}
