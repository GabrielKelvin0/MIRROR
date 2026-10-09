import { requireRole } from "@/lib/auth/session";
import { reportRepository } from "@/lib/db/repositories/report-repository";
import { MyReports } from "@/components/reporting/MyReports";
export const metadata = { title: "My reports · MIRROR Creator" };
export default async function CreatorReports() {
  const user = await requireRole("CREATOR");
  return <MyReports reports={await reportRepository.listOwned(user.id)} />;
}
