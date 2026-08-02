export type DueBucket = "overdue" | "today" | "upcoming";

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Day-granularity bucket for a "YYYY-MM-DD" (or full ISO) due date string. */
export const getDueBucket = (dueDate: string): DueBucket => {
  const todayKey = toDateKey(new Date());
  const dueKey = dueDate.slice(0, 10);
  if (dueKey < todayKey) return "overdue";
  if (dueKey === todayKey) return "today";
  return "upcoming";
};

interface DueBucketStyle {
  label: (dueDate: string) => string;
  bg: string;
  border: string;
  fg: string;
  dot: string;
}

const formatUpcoming = (dueDate: string) => {
  const d = new Date(dueDate.length > 10 ? dueDate : `${dueDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const DUE_BUCKET_STYLE: Record<DueBucket, DueBucketStyle> = {
  overdue: { label: () => "Overdue", bg: "#fef2f2", border: "#fecaca", fg: "#b91c1c", dot: "#ef4444" },
  today: { label: () => "Due today", bg: "#fff1f2", border: "#fbc9d2", fg: "#be123c", dot: "#f43f5e" },
  upcoming: { label: formatUpcoming, bg: "#fff7ed", border: "#fed7aa", fg: "#c2410c", dot: "#f97316" },
};
