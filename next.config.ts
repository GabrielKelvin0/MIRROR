import type { NextConfig } from "next";

// Conservative security headers. CSP and HSTS are intentionally deferred:
// - A Clerk-compatible Content-Security-Policy needs to be validated against a
//   real staging deployment before it is shipped (guessing risks breaking
//   Clerk's auth pages, which are not locally runtime-verifiable here).
// - Vercel manages Strict-Transport-Security for production deployments.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
