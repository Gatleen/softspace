import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Input, Textarea, Image, Text } from "@chakra-ui/react";
import { Clock, Trash2 } from "lucide-react";
import SoftSpaceCard from "./ui/SoftSpaceCard";
import SectionHeader from "./ui/SectionHeader";
import { recordReminderCreated, recordReminderFired } from "../lib/achievements";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Reminder {
  id: string;
  title: string;
  note: string;
  datetime: string;
  fired: boolean;
  repeat: "none" | "daily" | "weekly";
}

// One-shot, same-tab toast signal — intentionally stays in localStorage (no
// need for durability/cross-device sync), unlike the Reminder records above.
const TOAST_KEY = "softspace_fired_toast";

// Push the full unfired list to the service worker so it can fire
// browser notifications even when this tab is not focused.
const syncToSW = (reminders: Reminder[]) => {
  const unfired = reminders.filter((r) => !r.fired);
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: "SYNC_REMINDERS",
    reminders: unfired,
  });
};

// ─── Misc helpers ─────────────────────────────────────────────────────────────
// `datetime` is kept as a naive local "YYYY-MM-DDTHH:mm" string everywhere in
// this component (matches <input type="datetime-local">) — only converted
// to/from a real UTC timestamp at the Supabase read/write boundary below.
const formatLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localNow = () => formatLocalInput(new Date());
const toLocalInputValue = (iso: string) => formatLocalInput(new Date(iso));

const fmtDatetime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const minutesUntil = (iso: string) =>
  Math.round((new Date(iso).getTime() - Date.now()) / 60000);

// A short "when" label for the reminder's time chip.
const whenLabel = (r: Reminder) => {
  if (r.fired) return fmtDatetime(r.datetime);
  const m = minutesUntil(r.datetime);
  if (m < 0)  return "overdue";
  if (m < 60) return `in ${m}m`;
  return fmtDatetime(r.datetime);
};

// Pastel color for the "repeat: {repeat}" chip, keyed off the repeat value.
const repeatChipStyle = (repeat: Reminder["repeat"]) => {
  if (repeat === "daily")  return { bg: "#F6F0FF", color: "#8A6BD1" };
  if (repeat === "weekly") return { bg: "#F1F8FE", color: "#5B8FD6" };
  return { bg: "#F4F1F6", color: "#A08B9B" };
};

// Trailing status pill: buckets the existing fired / minutesUntil logic into
// done (fired) vs. upcoming-soon vs. further-out.
const statusPill = (r: Reminder) => {
  if (r.fired) return { label: "Done", bg: "#EDFBF1", color: "#0E9F6E" };
  const m = minutesUntil(r.datetime);
  if (m < 0)   return { label: "Overdue", bg: "#FFF0F6", color: "#F27DAB" };
  if (m < 120) return { label: "Soon",    bg: "#FFF0F6", color: "#F27DAB" };
  return { label: "Later", bg: "#F1F8FE", color: "#5B8FD6" };
};

const REPEAT_OPTIONS = ["none", "daily", "weekly"] as const;

// ─── Component ────────────────────────────────────────────────────────────────
const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const remindersRef = useRef<Reminder[]>([]);
  const [notifPerm,  setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", note: "", datetime: localNow(), repeat: "none" as Reminder["repeat"],
  });

  // Load persisted reminders from Supabase on mount.
  useEffect(() => {
    let cancelled = false;
    supabase.from("reminders").select("*").then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        if (error) console.warn("load reminders:", error);
        return;
      }
      setReminders(
        data.map((row) => ({
          id: row.id,
          title: row.title,
          note: row.note,
          datetime: toLocalInputValue(row.datetime),
          fired: row.fired,
          repeat: row.repeat,
        }))
      );
    });
    return () => { cancelled = true; };
  }, []);

  // Sync to SW whenever the list changes (including the initial load above).
  useEffect(() => {
    remindersRef.current = reminders;
    syncToSW(reminders);
  }, [reminders]);

  // Re-sync to SW once the SW controller is ready (after first registration)
  useEffect(() => {
    const onControllerChange = () => syncToSW(remindersRef.current);
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const requestPerm = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPerm(result);
  };

  // Fire a reminder: browser notification + signal for the in-app global toast
  const fire = useCallback((r: Reminder) => {
    // Signal Dashboard-level global toast (no matter which view is active)
    try {
      localStorage.setItem(TOAST_KEY, JSON.stringify({ id: r.id, title: r.title, note: r.note }));
    } catch {}

    // Browser notification (works when SoftSpace is open but not focused)
    if (notifPerm === "granted") {
      new Notification(`Reminder: ${r.title}`, {
        body:  r.note || "Your SoftSpace reminder is here!",
        icon:  "/Favicon.png",
        tag:   r.id,
      });
    }

    recordReminderFired();
  }, [notifPerm]);

  // Check every 30 s for due reminders. Each changed row's Supabase update is
  // awaited and only folded into local state on confirmed success — if it
  // fails, that reminder's local state stays "still due" so it naturally
  // retries next tick instead of drifting from the DB and double-firing
  // after a refresh.
  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      const due = remindersRef.current.filter((r) => !r.fired && new Date(r.datetime).getTime() <= now);
      if (due.length === 0) return;

      const confirmed: Record<string, Partial<Reminder>> = {};
      await Promise.all(due.map(async (r) => {
        fire(r);
        let patch: Partial<Reminder>;
        let dbPatch: Record<string, unknown>;
        if (r.repeat === "none") {
          patch = { fired: true };
          dbPatch = { fired: true };
        } else {
          const d = new Date(r.datetime);
          if (r.repeat === "daily")  d.setDate(d.getDate() + 1);
          if (r.repeat === "weekly") d.setDate(d.getDate() + 7);
          const nextLocal = formatLocalInput(d);
          patch = { datetime: nextLocal };
          dbPatch = { datetime: d.toISOString() };
        }
        const { error } = await supabase.from("reminders").update(dbPatch).eq("id", r.id);
        if (error) console.warn("reminder tick:", error);
        else confirmed[r.id] = patch;
      }));

      if (Object.keys(confirmed).length === 0) return;
      setReminders((prev) => prev.map((r) => (confirmed[r.id] ? { ...r, ...confirmed[r.id] } : r)));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [fire]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addReminder = () => {
    if (!form.title.trim()) return;
    const r: Reminder = {
      id: crypto.randomUUID(),
      title: form.title.trim(), note: form.note.trim(),
      datetime: form.datetime, fired: false, repeat: form.repeat,
    };
    setReminders((prev) => [...prev, r]);
    setForm({ title: "", note: "", datetime: localNow(), repeat: "none" });
    setShowForm(false);
    recordReminderCreated();
    supabase.from("reminders").insert({
      id: r.id, title: r.title, note: r.note,
      datetime: new Date(r.datetime).toISOString(),
      fired: r.fired, repeat: r.repeat,
    }).then(({ error }) => { if (error) console.warn("addReminder:", error); });
  };

  const deleteReminder = (id: string) => {
    setReminders((p) => p.filter((r) => r.id !== id));
    supabase.from("reminders").delete().eq("id", id)
      .then(({ error }) => { if (error) console.warn("deleteReminder:", error); });
  };

  const reschedule = (id: string) => {
    const next = localNow();
    setReminders((p) => p.map((r) => r.id === id ? { ...r, fired: false, datetime: next } : r));
    supabase.from("reminders").update({ fired: false, datetime: new Date(next).toISOString() }).eq("id", id)
      .then(({ error }) => { if (error) console.warn("reschedule:", error); });
  };

  const clearDone = () => {
    const doneIds = reminders.filter((r) => r.fired).map((r) => r.id);
    setReminders((p) => p.filter((r) => !r.fired));
    if (doneIds.length === 0) return;
    supabase.from("reminders").delete().in("id", doneIds)
      .then(({ error }) => { if (error) console.warn("clearDone:", error); });
  };

  // Single merged list for the reskinned layout: unfired first (soonest due
  // first), then fired/done ones trailing at the bottom.
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.fired !== b.fired) return a.fired ? 1 : -1;
    return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
  });
  const firedCount = reminders.filter((r) => r.fired).length;

  const notifCopy = () => {
    if (notifPerm === "granted") {
      return { title: "Notifications are on ♥", sub: "We'll nudge you gently, even off-tab." };
    }
    if (notifPerm === "denied") {
      return { title: "Notifications are off", sub: "Enable them in your browser settings for a gentle nudge." };
    }
    return { title: "Turn notifications on?", sub: "So we can nudge you gently when it's time." };
  };
  const notif = notifCopy();

  return (
    <Box>
      <SectionHeader title="Gentle Nudges" />

      {/* Notification status banner */}
      <Box
        display="flex"
        alignItems="center"
        gap="14px"
        padding="16px 20px"
        borderRadius="22px"
        background="linear-gradient(135deg,#FDF2F8,#F4EEFF)"
        border="2.5px solid #EEDCFB"
        marginBottom="22px"
      >
        <Box
          w="44px" h="44px" flexShrink={0}
          borderRadius="14px"
          bg="white"
          boxShadow="0 3px 0 rgba(205,180,246,.4)"
          display="flex" alignItems="center" justifyContent="center"
        >
          <Clock size={20} color="#8A6BD1" />
        </Box>
        <Box flex="1" minW={0}>
          <Text fontSize="13.5px" fontWeight="800" color="#8A6BD1">{notif.title}</Text>
          <Text fontSize="11.5px" fontWeight="600" color="#A08B9B">{notif.sub}</Text>
        </Box>
        <Box
          as="button"
          onClick={requestPerm}
          flexShrink={0}
          px="16px" py="8px"
          borderRadius="999px"
          background="white"
          border="2px solid #EEDCFB"
          color="#8A6BD1"
          fontSize="12px"
          fontWeight="800"
          cursor="pointer"
        >
          Manage
        </Box>
      </Box>

      {/* Main layout */}
      <Box display="flex" gap="22px" alignItems="flex-start" flexWrap={{ base: "wrap", lg: "nowrap" }}>

        {/* Left: reminder list */}
        <Box flex="1" minW={0} display="flex" flexDirection="column" gap="14px">
          {sortedReminders.length === 0 && (
            <Box
              bg="white" borderRadius="22px" border="2.5px dashed #FFDDEB"
              padding="28px 20px" textAlign="center"
            >
              <Text fontSize="13px" fontWeight="700" color="#A08B9B">
                No reminders yet — add one on the right ♥
              </Text>
            </Box>
          )}

          {sortedReminders.map((r) => {
            const status = statusPill(r);
            const repeatStyle = repeatChipStyle(r.repeat);
            return (
              <Box
                key={r.id}
                display="flex"
                gap="16px"
                padding="16px 20px"
                borderRadius="22px"
                background="white"
                border="2.5px solid #FFDDEB"
                boxShadow="0 5px 0 rgba(255,199,222,.4)"
                opacity={r.fired ? 0.85 : 1}
              >
                <Image src="/icons/Clock.png" alt="" boxSize="52px" objectFit="contain" flexShrink={0} />

                <Box flex="1" minW={0}>
                  <Text
                    fontFamily="'Jersey 25', cursive"
                    fontSize="26px"
                    lineHeight="1.1"
                    color="#C0577E"
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {r.title}
                  </Text>
                  {r.note && (
                    <Text
                      fontSize="12px" fontWeight="600" color="#A08B9B"
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {r.note}
                    </Text>
                  )}
                  <Box display="flex" flexWrap="wrap" gap="8px" marginTop="8px">
                    <Box
                      px="10px" py="4px" borderRadius="999px"
                      background="#FFF6FA" border="1.5px solid #FFE9F1" color="#8A7690"
                      fontSize="10.5px" fontWeight="800"
                    >
                      {"⏰"} {whenLabel(r)}
                    </Box>
                    <Box
                      px="10px" py="4px" borderRadius="999px"
                      background={repeatStyle.bg} color={repeatStyle.color}
                      fontSize="10.5px" fontWeight="800"
                    >
                      repeat: {r.repeat}
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="space-between" flexShrink={0}>
                  <Box
                    px="12px" py="5px" borderRadius="999px"
                    background={status.bg} color={status.color}
                    fontSize="10.5px" fontWeight="800" whiteSpace="nowrap"
                  >
                    {status.label}
                  </Box>
                  <Box display="flex" gap="6px" mt="8px">
                    {r.fired && (
                      <Box
                        as="button" title="Reschedule"
                        onClick={() => reschedule(r.id)}
                        color="#B79ACB" cursor="pointer"
                        display="flex" alignItems="center" justifyContent="center"
                      >
                        <Clock size={14} />
                      </Box>
                    )}
                    <Box
                      as="button" title="Delete"
                      onClick={() => deleteReminder(r.id)}
                      color="#C2AECF" cursor="pointer"
                      display="flex" alignItems="center" justifyContent="center"
                    >
                      <Trash2 size={14} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {firedCount > 0 && (
            <Box
              as="button" alignSelf="flex-start"
              onClick={clearDone}
              color="#B79ACB" fontSize="11.5px" fontWeight="700" cursor="pointer"
              padding="4px 4px"
            >
              Clear all done ({firedCount})
            </Box>
          )}
        </Box>

        {/* Right: add reminder form */}
        <Box w={{ base: "100%", lg: "380px" }} flexShrink={0}>
          <SoftSpaceCard title="New reminder" subtitle="Future you says thank you">
            {!showForm ? (
              <Box textAlign="center" padding="12px 4px 4px">
                <Box
                  mx="auto" mb="10px" w="52px" h="52px" borderRadius="18px"
                  background="#FFF6FA" display="flex" alignItems="center" justifyContent="center"
                >
                  <Clock size={24} color="#F27DAB" />
                </Box>
                <Text fontSize="13px" fontWeight="700" color="#8A7690" mb="14px">
                  Ready to set a gentle nudge?
                </Text>
                <Box
                  as="button"
                  onClick={() => setShowForm(true)}
                  display="inline-block" px="22px" py="10px" borderRadius="999px"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                  border="2.5px solid white"
                  boxShadow="0 5px 0 rgba(196,87,127,.22)"
                  fontFamily="'Jersey 25', cursive" fontSize="16px" color="white" cursor="pointer"
                >
                  + New reminder
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap="12px">
                <Box display="flex" justifyContent="flex-end">
                  <Box
                    as="button" onClick={() => setShowForm(false)}
                    fontSize="11px" fontWeight="700" color="#B79ACB" cursor="pointer"
                  >
                    Cancel
                  </Box>
                </Box>

                <Box>
                  <Text fontSize="10.5px" fontWeight="800" color="#B79ACB" mb="6px" letterSpacing="wide">TITLE</Text>
                  <Input
                    placeholder="e.g. Take a break"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addReminder()}
                    background="#FFF9FC" border="2px solid #FFDDEB" borderRadius="14px"
                    padding="11px 14px" height="auto" fontSize="13px"
                    _focus={{ borderColor: "#F9A8CB" }}
                  />
                </Box>

                <Box>
                  <Text fontSize="10.5px" fontWeight="800" color="#B79ACB" mb="6px" letterSpacing="wide">NOTE (optional)</Text>
                  <Textarea
                    placeholder="Any extra details..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    background="#FFF9FC" border="2px solid #FFDDEB" borderRadius="14px"
                    padding="11px 14px" fontSize="13px" rows={2} resize="none"
                    _focus={{ borderColor: "#F9A8CB" }}
                  />
                </Box>

                <Box>
                  <Text fontSize="10.5px" fontWeight="800" color="#B79ACB" mb="6px" letterSpacing="wide">DATE &amp; TIME</Text>
                  <Input
                    type="datetime-local"
                    value={form.datetime}
                    onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                    background="#FFF9FC" border="2px solid #FFDDEB" borderRadius="14px"
                    padding="11px 14px" height="auto" fontSize="13px"
                    _focus={{ borderColor: "#F9A8CB" }}
                  />
                </Box>

                <Box>
                  <Text fontSize="10.5px" fontWeight="800" color="#B79ACB" mb="6px" letterSpacing="wide">REPEAT</Text>
                  <Box display="flex" gap="8px">
                    {REPEAT_OPTIONS.map((opt) => {
                      const active = form.repeat === opt;
                      return (
                        <Box
                          key={opt}
                          as="button"
                          onClick={() => setForm({ ...form, repeat: opt })}
                          flex="1" textAlign="center" py="8px"
                          borderRadius="999px"
                          fontFamily="'Jersey 25', cursive" fontSize="14px"
                          border={active ? "2.5px solid white" : "2px solid #FFDDEB"}
                          background={active ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)" : "white"}
                          color={active ? "white" : "#8A7690"}
                          boxShadow={active ? "0 5px 0 rgba(196,87,127,.22)" : "none"}
                          cursor="pointer"
                        >
                          {opt === "none" ? "None" : opt === "daily" ? "Daily" : "Weekly"}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                <Box
                  as="button" onClick={addReminder}
                  width="100%" mt="4px" py="12px" borderRadius="999px"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                  border="2.5px solid white"
                  boxShadow="0 5px 0 rgba(196,87,127,.22)"
                  fontFamily="'Jersey 25', cursive" fontSize="18px" color="white" cursor="pointer"
                >
                  Add reminder {"♥"}
                </Box>
              </Box>
            )}
          </SoftSpaceCard>
        </Box>
      </Box>
    </Box>
  );
};

// Export the toast key so Dashboard can read it
export { TOAST_KEY };

export default Reminders;
