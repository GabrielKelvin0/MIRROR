import { requireRole } from "@/lib/auth/session";
import { reportRepository } from "@/lib/db/repositories/report-repository";
import { MyReports } from "@/components/reporting/MyReports";
export const metadata = { title: "My reports · MIRROR Learner" };
export default async function LearnerReports() {
  const user = await requireRole("LEARNER");
  return <MyReports reports={await reportRepository.listOwned(user.id)} />;
}
