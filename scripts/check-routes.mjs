#!/usr/bin/env node
/**
 * Lightweight App Router structure guard for MIRROR.
 *
 * Route groups such as (learner), (creator), and (admin) do NOT contribute URL
 * segments. That mistake previously produced colliding routes (e.g. three
 * dashboards resolving to /dashboard) which Vercel rejected at build time.
 *
 * This script:
 *   1. walks app/ and resolves every page/route file to its real URL
 *   2. fails when two files resolve to the same URL
 *   3. fails when a protected page under a role group is missing its role
 *      segment (/learner/*, /creator/*, /admin/*)
 *   4. fails when an expected key route is absent
 *
 * It is intentionally conservative: no dependency on Next internals.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import process from "node:process";

const APP_DIR = join(process.cwd(), "app");
const ROLE_PREFIXES = {
  "(learner)": "learner",
  "(creator)": "creator",
  "(admin)": "admin",
};
const EXPECTED_ROUTES = [
  "/",
  "/about",
  "/how-it-works",
  "/strategies",
  "/strategies/[slug]",
  "/research",
  "/research/[slug]",
  "/sign-in",
  "/sign-up",
  "/learner/dashboard",
  "/learner/following",
  "/learner/notifications",
  "/learner/portfolio",
  "/learner/portfolio/[id]",
  "/learner/academy",
  "/learner/academy/[courseSlug]",
  "/learner/academy/[courseSlug]/[lessonSlug]",
  "/learner/subscription",
  "/creator/dashboard",
  "/creator/dashboard/strategies/new",
  "/creator/dashboard/strategies/[id]/edit",
  "/creator/dashboard/strategies/[id]/preview",
  "/admin/dashboard",
  "/admin/users",
  "/admin/creators",
  "/admin/strategies",
  "/admin/reports",
];

function walk(dir, entries) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith("_")) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, entries);
    } else if (/^(page|route)\.(ts|tsx|js|jsx)$/.test(name)) {
      entries.push(full);
    }
  }
}

function routeFor(file) {
  const rel = relative(APP_DIR, file).split(sep);
  const segments = rel
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .filter((segment) => !/^(page|route)\.(ts|tsx|js|jsx)$/.test(segment));
  return "/" + segments.join("/");
}

function issues(route, file) {
  const groups = relative(APP_DIR, file).split(sep).filter((s) => s in ROLE_PREFIXES);
  const prefix = ROLE_PREFIXES[groups[0]];
  const expectedPrefix = "/" + prefix + "/";
  if (prefix && route !== expectedPrefix && !route.startsWith(expectedPrefix)) {
    return `page under (${prefix}) route group must live under ${expectedPrefix}* but resolves to ${route}`;
  }
  return null;
}

const files = [];
walk(APP_DIR, files);
const byRoute = new Map();
const problems = [];

for (const file of files) {
  const route = routeFor(file);
  if (byRoute.has(route)) {
    problems.push(`duplicate route ${route}: ${byRoute.get(route)} and ${file}`);
  } else {
    byRoute.set(route, file);
  }
  const issue = issues(route, file);
  if (issue) problems.push(issue);
}

for (const expected of EXPECTED_ROUTES) {
  if (!byRoute.has(expected)) {
    problems.push(`expected route missing: ${expected}`);
  }
}

if (problems.length > 0) {
  console.error("Route structure check FAILED:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Route structure check OK (${files.length} page/route files, ${byRoute.size} unique routes)`);
