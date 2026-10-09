import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Match complete role path segments so public routes such as /creators
// remain public alongside the marketing website and auth pages.
const isProtectedRoute = createRouteMatcher([
  "/learner/:path*",
  "/creator/:path*",
  "/admin/:path*",
  "/reports/:path*",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }
  return undefined;
});

export const config = {
  // Run on all routes except static assets. Clerk's matcher ignores
  // files with a dot in the path and Next.js internals. Includes Clerk's
  // auto-proxy path so Clerk routes always run through the middleware.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
