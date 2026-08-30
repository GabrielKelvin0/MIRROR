"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/strategies", label: "Strategies" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-baseline gap-2 text-neutral-900"
          aria-label="MIRROR home"
        >
          <span className="text-xl font-bold tracking-tight">MIRROR</span>
          <span className="hidden text-sm font-medium text-neutral-500 sm:inline">
            strategy transparency
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  active ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Create account
            </Link>
          </SignedOut>
          <SignedIn>
            <span className="text-sm text-neutral-500">{user?.firstName ?? "Signed in"}</span>
            <Link
              href="/learner/dashboard"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Dashboard
            </Link>
            <SignOutButton>
              <button className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                Sign out
              </button>
            </SignOutButton>
          </SignedIn>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-neutral-200 bg-white px-4 pb-6 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-base font-medium ${
                    active
                      ? "bg-neutral-50 text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-base font-medium text-white hover:bg-emerald-700"
              >
                Create account
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/learner/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-center text-base font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Dashboard
              </Link>
              <SignOutButton>
                <button className="rounded-md px-3 py-2 text-base font-medium text-neutral-600">
                  Sign out
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
      ) : null}
    </header>
  );
}
