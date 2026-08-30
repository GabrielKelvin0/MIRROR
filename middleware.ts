import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected route prefixes. The marketing/public website and auth pages
// remain public.
const isProtectedRoute = createRouteMatcher([
  "/learner(.*)",
  "/creator(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  if (isProtectedRoute(req) && !userId) {
    return auth().redirectToSignIn({ returnBackUrl: req.url });
  }
  return undefined;
});

export const config = {
  // Run on all routes except static assets. Clerk's matcher ignores
  // files with a dot in the path and Next.js internals.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
