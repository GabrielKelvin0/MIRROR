import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const [users, learners, creators, admins, strategies, follows, portfolios, progress, reports] = await Promise.all([
    prisma.user.count(), prisma.user.count({where:{role:"LEARNER"}}), prisma.user.count({where:{role:"CREATOR"}}), prisma.user.count({where:{role:"ADMIN"}}),
    prisma.strategy.groupBy({by:["status"],_count:true}), prisma.follow.count(), prisma.paperPortfolio.count(), prisma.progress.count(), prisma.report.count({where:{status:"OPEN"}}),
  ]);
  const counts=Object.fromEntries(strategies.map(s=>[s.status,s._count]));
  return <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8"><div><h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1><p className="mt-2 text-neutral-600">Platform stewardship, visibility, and moderation overview.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Users",users],["Learners",learners],["Creators",creators],["Admins",admins],["Published strategies",counts["PUBLISHED"]||0],["Draft strategies",counts["DRAFT"]||0],["Follows",follows],["Paper portfolios",portfolios],["Academy progress records",progress],["Open reports",reports]].map(([label,value])=><div key={label} className="rounded-lg border border-neutral-200 bg-white p-5"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p></div>)}</div>
    <div className="rounded-lg border border-neutral-200 bg-white p-6"><h2 className="font-semibold">Strategy visibility</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-neutral-500"><th className="py-2">Status</th><th className="py-2">Count</th></tr></thead><tbody>{["PUBLISHED","DRAFT","ARCHIVED"].map(s=><tr key={s} className="border-b last:border-0"><td className="py-3">{s[0]+s.slice(1).toLowerCase()}</td><td className="py-3">{counts[s]||0}</td></tr>)}</tbody></table></div></div>
  </div>;
}
