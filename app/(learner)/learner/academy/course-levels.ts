import { coursesByLevel } from "@/lib/data/curriculum";

/** Academy course levels in display order, each with its ordered courses. */
export const COURSES_BY_LEVEL_ORDER = [
  { level: "BEGINNER", courses: coursesByLevel("BEGINNER") },
  { level: "INTERMEDIATE", courses: coursesByLevel("INTERMEDIATE") },
  { level: "ADVANCED", courses: coursesByLevel("ADVANCED") },
] as const;
