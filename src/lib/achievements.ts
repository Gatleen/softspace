import { supabase } from "./supabase";

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

/** Pure display metadata — unlock state lives exclusively in Supabase (achievement_state), never here. */
export const BADGES: Badge[] = [
  // Tasks
  { id: "first-step", name: "First Step", desc: "Complete your very first task", icon: "🌱" },
  { id: "task-master", name: "Task Master", desc: "Complete 10 tasks total", icon: "✅" },
  { id: "star-collector", name: "Star Collector", desc: "Star 5 important tasks", icon: "⭐" },
  // Focus
  { id: "focus-spark", name: "Focus Spark", desc: "Complete your first Pomodoro session", icon: "🍅" },
  { id: "deep-focus", name: "Deep Focus", desc: "Complete 10 Pomodoro sessions", icon: "🔥" },
  { id: "break-taker", name: "Break Taker", desc: "Use a break mode in the Pomodoro timer", icon: "☕" },
  // Journal
  { id: "journalist", name: "Journalist", desc: "Write your first journal entry", icon: "✍️" },
  { id: "dear-diary", name: "Dear Diary", desc: "Write 7 journal entries", icon: "📔" },
  // Sticky notes
  { id: "sticky-fingers", name: "Sticky Fingers", desc: "Add your first sticky note", icon: "📝" },
  // Mood
  { id: "mood-check-in", name: "Mood Check-In", desc: "Log your mood for the first time", icon: "😊" },
  { id: "emotionally-aware", name: "Emotionally Aware", desc: "Log 7 different moods", icon: "🌈" },
  // Learning
  { id: "lifelong-learner", name: "Lifelong Learner", desc: "Add your first course or project", icon: "📚" },
  { id: "course-complete", name: "Course Complete", desc: "Mark a learning project as Done", icon: "🎓" },
  { id: "certified", name: "Certified", desc: "Earn a certificate for a completed course", icon: "🏅" },
  // Finance
  { id: "money-moves", name: "Money Moves", desc: "Log your first transaction", icon: "💸" },
  { id: "goal-setter", name: "Goal Setter", desc: "Create your first savings goal", icon: "🎯" },
  { id: "dream-achieved", name: "Dream Achieved", desc: "Reach 100% on a savings goal", icon: "🏆" },
  // Friends
  { id: "new-friend", name: "New Friend", desc: "Visit the Friends page for the first time", icon: "🦋" },
  { id: "social-butterfly", name: "Social Butterfly", desc: "View all your companions", icon: "🌸" },
  // Games
  { id: "card-shark", name: "Card Shark", desc: "Win a game of Sticker Match", icon: "🃏" },
  { id: "storyteller", name: "Storyteller", desc: "Roll a Journaling Dice prompt", icon: "🎲" },
  // Reminders
  { id: "reminder-set", name: "Reminder Set", desc: "Create your first reminder", icon: "⏰" },
  { id: "right-on-time", name: "Right on Time", desc: "Have a reminder fire", icon: "⏱️" },
  // Music
  { id: "crate-digger", name: "Crate Digger", desc: "Add your first custom playlist", icon: "💿" },
  // Consistency
  { id: "early-bird", name: "Early Bird", desc: "Open SoftSpace before 8 AM", icon: "☀️" },
  { id: "night-owl", name: "Night Owl", desc: "Complete a task after 10 PM", icon: "🌙" },
  { id: "consistent", name: "Consistent", desc: "Use SoftSpace 5 days in a row", icon: "🔑" },
];

interface AchievementRow {
  id: number;
  unlocked_badges: string[];
  counters: Record<string, number>;
  sets: Record<string, string[]>;
}

const ROW_ID = 1;
/** Reuses the exact toast-signal pattern Reminders.tsx already uses for TOAST_KEY. */
export const BADGE_TOAST_KEY = "softspace_badge_toast";

let cache: AchievementRow | null = null;

const emptyRow = (): AchievementRow => ({ id: ROW_ID, unlocked_badges: [], counters: {}, sets: {} });

const loadRow = async (): Promise<AchievementRow> => {
  if (cache) return cache;
  try {
    const { data, error } = await supabase.from("achievement_state").select("*").eq("id", ROW_ID).single();
    cache = !error && data ? (data as AchievementRow) : emptyRow();
  } catch {
    cache = emptyRow();
  }
  return cache;
};

const saveRow = async (row: AchievementRow) => {
  cache = row;
  try {
    await supabase
      .from("achievement_state")
      .update({
        unlocked_badges: row.unlocked_badges,
        counters: row.counters,
        sets: row.sets,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ROW_ID);
  } catch {
    // Fail soft — this session's cache is still updated, just not persisted.
  }
};

const announce = (badge: Badge) => {
  try {
    localStorage.setItem(BADGE_TOAST_KEY, JSON.stringify({ id: badge.id, name: badge.name, icon: badge.icon }));
  } catch {
    // ignore
  }
};

const unlock = (row: AchievementRow, id: string) => {
  if (row.unlocked_badges.includes(id)) return;
  row.unlocked_badges = [...row.unlocked_badges, id];
  const badge = BADGES.find((b) => b.id === id);
  if (badge) announce(badge);
};

const bump = (row: AchievementRow, key: string): number => {
  const next = (row.counters[key] ?? 0) + 1;
  row.counters = { ...row.counters, [key]: next };
  return next;
};

const addToSet = (row: AchievementRow, key: string, value: string): string[] => {
  const current = row.sets[key] ?? [];
  if (!current.includes(value)) row.sets = { ...row.sets, [key]: [...current, value] };
  return row.sets[key];
};

export const getAchievementState = () => loadRow();

export const recordTaskCompleted = async () => {
  const row = await loadRow();
  const count = bump(row, "tasksCompleted");
  if (count >= 1) unlock(row, "first-step");
  if (count >= 10) unlock(row, "task-master");
  if (new Date().getHours() >= 22) unlock(row, "night-owl");
  await saveRow(row);
};

export const recordTaskStarred = async () => {
  const row = await loadRow();
  const count = bump(row, "tasksStarred");
  if (count >= 5) unlock(row, "star-collector");
  await saveRow(row);
};

export const recordStickyNoteAdded = async () => {
  const row = await loadRow();
  bump(row, "stickyNotesAdded");
  unlock(row, "sticky-fingers");
  await saveRow(row);
};

export const recordMoodLogged = async (moodName: string) => {
  const row = await loadRow();
  unlock(row, "mood-check-in");
  const types = addToSet(row, "moodsLoggedTypes", moodName);
  if (types.length >= 7) unlock(row, "emotionally-aware");
  await saveRow(row);
};

export const recordFocusSessionCompleted = async () => {
  const row = await loadRow();
  const count = bump(row, "focusSessionsCompleted");
  if (count >= 1) unlock(row, "focus-spark");
  if (count >= 10) unlock(row, "deep-focus");
  await saveRow(row);
};

export const recordBreakModeUsed = async () => {
  const row = await loadRow();
  unlock(row, "break-taker");
  await saveRow(row);
};

export const recordCompanionViewed = async (name: string) => {
  const row = await loadRow();
  unlock(row, "new-friend");
  const viewed = addToSet(row, "companionsViewed", name);
  if (viewed.length >= 14) unlock(row, "social-butterfly");
  await saveRow(row);
};

export const recordGameWon = async (game: "memory" | "dice") => {
  const row = await loadRow();
  if (game === "memory") unlock(row, "card-shark");
  if (game === "dice") unlock(row, "storyteller");
  await saveRow(row);
};

export const recordReminderCreated = async () => {
  const row = await loadRow();
  unlock(row, "reminder-set");
  await saveRow(row);
};

export const recordReminderFired = async () => {
  const row = await loadRow();
  unlock(row, "right-on-time");
  await saveRow(row);
};

export const recordPlaylistAdded = async () => {
  const row = await loadRow();
  unlock(row, "crate-digger");
  await saveRow(row);
};

export const recordJournalEntryCount = async (count: number) => {
  const row = await loadRow();
  if (count >= 1) unlock(row, "journalist");
  if (count >= 7) unlock(row, "dear-diary");
  await saveRow(row);
};

export const recordFinanceState = async (opts: {
  transactionsCount?: number;
  goalsCount?: number;
  goalCompleted?: boolean;
}) => {
  const row = await loadRow();
  if (opts.transactionsCount && opts.transactionsCount >= 1) unlock(row, "money-moves");
  if (opts.goalsCount && opts.goalsCount >= 1) unlock(row, "goal-setter");
  if (opts.goalCompleted) unlock(row, "dream-achieved");
  await saveRow(row);
};

export const recordLearningState = async (opts: {
  projectsCount?: number;
  anyDone?: boolean;
  anyCertificate?: boolean;
}) => {
  const row = await loadRow();
  if (opts.projectsCount && opts.projectsCount >= 1) unlock(row, "lifelong-learner");
  if (opts.anyDone) unlock(row, "course-complete");
  if (opts.anyCertificate) unlock(row, "certified");
  await saveRow(row);
};

/** Called once on Dashboard mount — records today's visit, Early Bird, and the 5-day streak. */
export const recordAppVisit = async () => {
  const row = await loadRow();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  addToSet(row, "appVisitDates", toISO(new Date()));

  if (new Date().getHours() < 8) unlock(row, "early-bird");

  // Consecutive calendar days ending today, one grace day allowed —
  // same approach as LearningTracker.tsx's computeStreak.
  const dateSet = new Set(row.sets.appVisitDates ?? []);
  const cursor = new Date();
  if (!dateSet.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dateSet.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (streak >= 5) unlock(row, "consistent");

  await saveRow(row);
};
