import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { academyRepository, followRepository, notificationRepository, portfolioRepository } from "@/lib/db";

export default async function LearnerDashboard() {
  const user = await requireRole("LEARNER");
  const [followed, portfolios, notifications, completed] = await Promise.all([
    followRepository.listFollowed(user.id), portfolioRepository.listForUser(user.id),
    notificationRepository.listForUser(user.id), academyRepository.listCompletedLessonKeys(user.id),
  ]);
  const unread = notifications.filter((n) => !n.read).length;
  return <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
    <div><h1 className="text-3xl font-bold text-neutral-900">Your Dashboard</h1><p className="mt-2 text-neutral-600">A focused view of your research and learning activity.</p></div>
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/learner/following" className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-emerald-300"><h2 className="font-semibold">Followed strategies</h2><p className="mt-2 text-sm text-neutral-600">{followed.length} saved for study</p></Link>
      <Link href="/learner/academy" className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-emerald-300"><h2 className="font-semibold">Academy progress</h2><p className="mt-2 text-sm text-neutral-600">{completed.length} lesson{completed.length===1?"":"s"} completed</p></Link>
      <Link href="/learner/portfolio" className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-emerald-300"><h2 className="font-semibold">Paper portfolios</h2><p className="mt-2 text-sm text-neutral-600">{portfolios.length} simulated portfolio{portfolios.length===1?"":"s"}</p></Link>
      <Link href="/learner/notifications" className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-emerald-300"><h2 className="font-semibold">Notifications</h2><p className="mt-2 text-sm text-neutral-600">{unread} unread educational update{unread===1?"":"s"}</p></Link>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-neutral-200 bg-white p-6"><h2 className="font-semibold">Continue your research</h2><p className="mt-2 text-sm text-neutral-600">Study transparent methodology and risk frameworks before making your own decisions.</p><Link href="/strategies" className="mt-4 inline-block text-sm font-medium text-emerald-700">Explore strategies</Link></section>
      <section className="rounded-lg border border-neutral-200 bg-white p-6"><h2 className="font-semibold">Build a learning portfolio</h2><p className="mt-2 text-sm text-neutral-600">Use paper portfolios to test your understanding with simulated values only.</p><Link href="/learner/portfolio" className="mt-4 inline-block text-sm font-medium text-emerald-700">Open portfolios</Link></section>
    </div>
  </div>;
}
