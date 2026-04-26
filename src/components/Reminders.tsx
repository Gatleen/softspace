import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Input, Textarea, VStack, HStack, Text, Badge, IconButton, SimpleGrid,
} from "@chakra-ui/react";
import { Plus, Trash2, Bell, BellOff, CheckCircle2, Clock, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Reminder {
  id: string;
  title: string;
  note: string;
  datetime: string;
  fired: boolean;
  repeat: "none" | "daily" | "weekly";
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY   = "softspace_reminders";
const TOAST_KEY     = "softspace_fired_toast";

export const loadReminders = (): Reminder[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};

const saveReminders = (list: Reminder[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

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
const localNow = () => {
  const d   = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDatetime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const minutesUntil = (iso: string) =>
  Math.round((new Date(iso).getTime() - Date.now()) / 60000);

// ─── Component ────────────────────────────────────────────────────────────────
const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [notifPerm,  setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", note: "", datetime: localNow(), repeat: "none" as Reminder["repeat"],
  });

  // Persist + sync to SW whenever the list changes
  useEffect(() => {
    saveReminders(reminders);
    syncToSW(reminders);
  }, [reminders]);

  // Re-sync to SW once the SW controller is ready (after first registration)
  useEffect(() => {
    const onControllerChange = () => syncToSW(loadReminders());
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
      new Notification(`⏰ ${r.title}`, {
        body:  r.note || "Your SoftSpace reminder is here!",
        icon:  "/Favicon.png",
        tag:   r.id,
      });
    }
  }, [notifPerm]);

  // Check every 30 s for due reminders
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setReminders((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (r.fired) return r;
          const due = new Date(r.datetime).getTime();
          if (now < due) return r;
          fire(r);
          changed = true;
          if (r.repeat === "none") return { ...r, fired: true };
          const d = new Date(r.datetime);
          if (r.repeat === "daily")  d.setDate(d.getDate() + 1);
          if (r.repeat === "weekly") d.setDate(d.getDate() + 7);
          return { ...r, datetime: d.toISOString().slice(0, 16) };
        });
        return changed ? next : prev;
      });
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
  };

  const deleteReminder  = (id: string) => setReminders((p) => p.filter((r) => r.id !== id));
  const reschedule      = (id: string) => setReminders((p) =>
    p.map((r) => r.id === id ? { ...r, fired: false, datetime: localNow() } : r)
  );

  const upcoming = reminders.filter((r) => !r.fired)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const fired    = reminders.filter((r) => r.fired);

  const urgencyColor = (iso: string) => {
    const m = minutesUntil(iso);
    if (m < 0)   return "#ef4444";
    if (m < 30)  return "#f97316";
    if (m < 120) return "#eab308";
    return "#a855f7";
  };

  return (
    <Box bg="linear-gradient(135deg,#fff0f6 0%,#f0f0ff 100%)" minH="100vh" p={8}>

      {/* Header */}
      <HStack mb={6} justify="space-between" flexWrap="wrap" gap={4}>
        <HStack gap={3}>
          <Box w="40px" h="40px" bg="pink.100" borderRadius="xl"
            display="flex" alignItems="center" justifyContent="center">
            <Bell size={22} color="#EC4899" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="2xl" fontWeight="900" color="pink.500">Reminders</Text>
            <Text fontSize="xs" color="pink.300" fontWeight="bold">Never miss a thing ✨</Text>
          </VStack>
        </HStack>

        <HStack gap={2}>
          {notifPerm !== "granted" ? (
            <Button size="sm" colorPalette="pink" borderRadius="full" fontWeight="800"
              variant="outline" onClick={requestPerm}>
              <Bell size={14} style={{ marginRight: "6px" }} />
              Allow Notifications
            </Button>
          ) : (
            <Badge colorPalette="green" variant="subtle" borderRadius="full" px={3} py={1}
              fontSize="xs" fontWeight="800">
              <CheckCircle2 size={12} style={{ display: "inline", marginRight: "4px" }} />
              Notifications On
            </Badge>
          )}
          <Button colorPalette="pink" borderRadius="full" fontWeight="800"
            boxShadow="0 4px 12px rgba(255,105,180,0.3)"
            onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} style={{ marginRight: "6px" }} />
            {showForm ? "Cancel" : "New Reminder"}
          </Button>
        </HStack>
      </HStack>

      {/* Add form */}
      {showForm && (
        <Box bg="white" p={6} borderRadius="3xl" mb={8}
          boxShadow="0 8px 30px rgba(236,72,153,0.12)"
          border="2px solid" borderColor="pink.100">
          <Text fontWeight="800" fontSize="lg" color="pink.500" mb={5}>New Reminder 🔔</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">TITLE *</Text>
              <Input placeholder="e.g. Take a break, Review notes..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                bg="pink.50" border="none" borderRadius="xl"
                onKeyDown={(e) => e.key === "Enter" && addReminder()}
                _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">DATE & TIME</Text>
              <Input type="datetime-local" value={form.datetime}
                onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                bg="pink.50" border="none" borderRadius="xl"
                _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
            </Box>
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">REPEAT</Text>
              <select value={form.repeat}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "none",
                  background: "#fff1f5", fontSize: "14px", fontWeight: 600, color: "#374151", outline: "none" }}
                onChange={(e) => setForm({ ...form, repeat: e.target.value as Reminder["repeat"] })}>
                <option value="none">No repeat</option>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
              </select>
            </Box>
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">NOTE (optional)</Text>
              <Textarea placeholder="Any extra details..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                bg="pink.50" border="none" borderRadius="xl" rows={2} resize="none"
                _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
            </Box>
          </SimpleGrid>
          <Button onClick={addReminder} colorPalette="pink" borderRadius="full" fontWeight="800"
            boxShadow="0 4px 12px rgba(255,105,180,0.3)">
            <Plus size={15} style={{ marginRight: "6px" }} /> Set Reminder
          </Button>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8} alignItems="start">

        {/* Upcoming */}
        <VStack gap={4} align="stretch">
          <Text fontSize="xs" fontWeight="800" color="gray.500" letterSpacing="wider">
            UPCOMING ({upcoming.length})
          </Text>
          {upcoming.length === 0 && (
            <Box bg="white" p={8} borderRadius="3xl" textAlign="center"
              border="2px dashed" borderColor="pink.100">
              <BellOff size={32} color="#FDA4AF" style={{ margin: "0 auto 12px" }} />
              <Text color="gray.400" fontSize="sm" fontWeight="600">
                No upcoming reminders — add one above!
              </Text>
            </Box>
          )}
          {upcoming.map((r) => {
            const mins    = minutesUntil(r.datetime);
            const overdue = mins < 0;
            const accent  = urgencyColor(r.datetime);
            return (
              <Box key={r.id} bg="white" borderRadius="2xl"
                boxShadow="0 4px 16px rgba(236,72,153,0.08)"
                border="2px solid" style={{ borderColor: overdue ? "#fca5a5" : "#fce7f3" }}
                overflow="hidden" transition="all 0.2s">
                <Box display="flex">
                  <Box w="4px" style={{ background: accent }} flexShrink={0} />
                  <Box flex={1} p={4}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" gap={1} flex={1} minW={0}>
                        <Text fontWeight="800" fontSize="md" color="gray.800"
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.title}
                        </Text>
                        {r.note && (
                          <Text fontSize="xs" color="gray.500" fontWeight="500"
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.note}
                          </Text>
                        )}
                        <HStack gap={2} flexWrap="wrap" mt={1}>
                          <HStack gap={1}>
                            <Clock size={11} color={accent} />
                            <Text fontSize="xs" fontWeight="700" style={{ color: accent }}>
                              {overdue ? "Overdue!" : mins < 60 ? `In ${mins} min` : fmtDatetime(r.datetime)}
                            </Text>
                          </HStack>
                          {!overdue && mins >= 60 && (
                            <Text fontSize="xs" color="gray.400">{fmtDatetime(r.datetime)}</Text>
                          )}
                          {r.repeat !== "none" && (
                            <Badge colorPalette="purple" variant="subtle" fontSize="9px" borderRadius="full">
                              🔁 {r.repeat}
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                      <IconButton aria-label="Delete" size="xs" variant="ghost"
                        colorPalette="red" borderRadius="full" onClick={() => deleteReminder(r.id)}>
                        <Trash2 size={13} />
                      </IconButton>
                    </HStack>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </VStack>

        {/* Past */}
        <VStack gap={4} align="stretch">
          <Text fontSize="xs" fontWeight="800" color="gray.500" letterSpacing="wider">
            PAST ({fired.length})
          </Text>
          {fired.length === 0 && (
            <Box bg="white" p={8} borderRadius="3xl" textAlign="center"
              border="2px dashed" borderColor="gray.100">
              <Text color="gray.300" fontSize="sm" fontWeight="600">
                Completed reminders will appear here ✓
              </Text>
            </Box>
          )}
          {fired.map((r) => (
            <Box key={r.id} bg="gray.50" borderRadius="2xl"
              border="1.5px solid" borderColor="gray.100" opacity={0.75} overflow="hidden">
              <Box display="flex">
                <Box w="4px" bg="gray.200" flexShrink={0} />
                <Box flex={1} p={4}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={0.5} flex={1} minW={0}>
                      <Text fontWeight="700" fontSize="sm" color="gray.500"
                        textDecoration="line-through"
                        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.title}
                      </Text>
                      <Text fontSize="xs" color="gray.400">{fmtDatetime(r.datetime)}</Text>
                    </VStack>
                    <HStack gap={1}>
                      <IconButton aria-label="Reschedule" size="xs" variant="ghost"
                        colorPalette="purple" borderRadius="full" title="Reschedule"
                        onClick={() => reschedule(r.id)}>
                        <Clock size={12} />
                      </IconButton>
                      <IconButton aria-label="Delete" size="xs" variant="ghost"
                        colorPalette="red" borderRadius="full" onClick={() => deleteReminder(r.id)}>
                        <Trash2 size={12} />
                      </IconButton>
                    </HStack>
                  </HStack>
                </Box>
              </Box>
            </Box>
          ))}
          {fired.length > 0 && (
            <Button size="sm" variant="ghost" colorPalette="red" borderRadius="full"
              fontWeight="700" onClick={() => setReminders((p) => p.filter((r) => !r.fired))}>
              Clear all past
            </Button>
          )}
        </VStack>
      </SimpleGrid>

      {/* Info box */}
      <Box mt={8} p={5} bg="white" borderRadius="2xl" border="1.5px solid" borderColor="purple.100">
        <Text fontWeight="800" fontSize="sm" color="purple.500" mb={2}>💡 How Reminders Work</Text>
        <VStack align="start" gap={1}>
          {[
            "A toast notification appears inside SoftSpace on any page when a reminder fires.",
            "Browser notifications fire even when you're on a different tab (requires permission).",
            "The service worker can fire notifications while the browser is open, even if SoftSpace is not your active tab.",
            "Repeating reminders auto-advance after they fire.",
            "Your reminders are saved locally in this browser.",
          ].map((tip, i) => (
            <HStack key={i} gap={2} align="start">
              <Text color="purple.300" fontSize="xs" mt={0.5}>•</Text>
              <Text fontSize="xs" color="gray.500" fontWeight="500">{tip}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

// Export the toast key so Dashboard can read it
export { TOAST_KEY };

export default Reminders;
