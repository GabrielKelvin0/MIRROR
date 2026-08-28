"use client";

import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">MIRROR</h1>
          <p className="text-neutral-600 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-900">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-900">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-900">
              I want to be a
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="radio" name="role" value="learner" defaultChecked />
                <span className="text-neutral-700">Learner (explore strategies)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="radio" name="role" value="creator" />
                <span className="text-neutral-700">Creator (publish strategies)</span>
              </label>
            </div>
          </div>

          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition">
            Create Account
          </button>

          <p className="text-center text-sm text-neutral-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-neutral-500">
          Paper portfolios are simulated. No real trades are executed.
        </p>
      </div>
    </main>
  );
}
