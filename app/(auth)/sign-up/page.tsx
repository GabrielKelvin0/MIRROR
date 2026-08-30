import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">MIRROR</h1>
          <p className="text-neutral-600 mt-2">Create your account</p>
        </div>

        <div className="flex justify-center bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <SignUp
            fallbackRedirectUrl="/learner/dashboard"
            signInUrl="/sign-in"
          />
        </div>

        <p className="text-center text-xs text-neutral-500">
          Paper portfolios are simulated. No real trades are executed.
          New accounts are created as Learner. Role changes are managed by
          the platform.
        </p>
      </div>
    </main>
  );
}
