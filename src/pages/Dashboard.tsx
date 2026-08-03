import { useEffect, useState } from "react";
import { Box, Container, Text } from "@chakra-ui/react";
import RoomBanner from "../components/ui/RoomBanner";

// Components
import Header from "../components/Header";
import TaskList from "../components/TaskList";
import StickyNotes from "../components/StickyNotes";
import MusicPlayer from "../components/MusicPlayer";
import CalendarWidget from "../components/CalendarWidget";
import WeatherWidget from "../components/WeatherWidget";
import ProgressTracker from "../components/ProgressTracker";
import PixelTimer from "../components/PomodoroTimer";
import Notebook from "../components/Notebook"; // Ensure this matches the non-popup version
import Navbar from "../components/NavigationBar";
import Achievements from "../components/Achievements";
import Companions from "../components/Companions";
import MoodTracker from "../components/MoodTracker"; // Assuming you have this component
import Games from "../components/Games";
import FinanceTracker from "../components/FinanceTracker";
import LearningTracker from "../components/LearningTracker";
import Reminders, { TOAST_KEY } from "../components/Reminders";
import { fetchJiraTasks } from "../lib/jiraTasks";
import { recordAppVisit, BADGE_TOAST_KEY } from "../lib/achievements";

interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: number;
  dueDate?: string;
  notes?: string;
  tags: string[];
  starred: boolean;
  archived: boolean;
  subtasks: Subtask[];
  source?: "local" | "jira";
  jiraKey?: string;
  jiraUrl?: string;
}

// How often to re-poll Jira for due-date changes (ms).
const JIRA_POLL_MS = 15 * 60 * 1000;

/** "Today's Tasks" side card next to the greeting card (mockup dashboard hero row) */
const TodaysTasksCard = ({ tasks }: { tasks: Task[] }) => {
  const visible = tasks.filter((t) => !t.archived).slice(0, 4);
  const remaining = tasks.filter((t) => !t.completed && !t.archived).length;

  return (
    <Box
      w={{ base: "100%", lg: "300px" }}
      flexShrink={0}
      bg="white"
      border="2.5px solid #FFDDEB"
      borderRadius="24px"
      boxShadow="0 6px 0 rgba(255,199,222,.45)"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box px="18px" py="14px" background="linear-gradient(135deg,#FFC2DA,#D9BFF7)">
        <Text fontFamily="'Jersey 25', cursive" fontSize="23px" color="white" letterSpacing=".6px" textShadow="0 2px 0 rgba(196,87,127,.3)">
          Today's Tasks
        </Text>
        <Text fontSize="10.5px" fontWeight="700" color="rgba(255,255,255,.9)">
          {remaining} remaining
        </Text>
      </Box>
      <Box px="18px" py="16px" display="flex" flexDirection="column" gap="9px">
        {visible.length === 0 && (
          <Text fontSize="11.5px" fontWeight="600" color="#C2AECF">
            No tasks yet — add some from the task list below ✧
          </Text>
        )}
        {visible.map((t) => (
          <Box
            key={t.id}
            display="flex"
            alignItems="center"
            gap="9px"
            px="12px"
            py="8px"
            borderRadius="999px"
            bg={t.completed ? "#EDFBF1" : "#FFF1F2"}
            border="2px solid"
            borderColor={t.completed ? "#BFE8CD" : "#FBC9D2"}
          >
            <Box w="9px" h="9px" borderRadius="999px" flexShrink={0} bg={t.completed ? "#22C55E" : "#F43F5E"} />
            <Text
              fontSize="12.5px"
              fontWeight="700"
              color={t.completed ? "#9DB0A5" : "#5C4A63"}
              textDecoration={t.completed ? "line-through" : "none"}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {t.text}
            </Text>
          </Box>
        ))}
        <Text mt="2px" fontSize="11.5px" fontWeight="600" color="#C2AECF">
          Add more from the task list below ✧
        </Text>
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [reminderToast, setReminderToast] = useState<{ id: string; title: string; note?: string } | null>(null);
  const [badgeToast, setBadgeToast] = useState<{ id: string; name: string; icon: string } | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [notes, setNotes] = useState<
    { id: number; text: string; bgColor: string; textColor: string }[]
  >([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll localStorage every 5 s for reminder signals written by Reminders.tsx
  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout>;
    const check = () => {
      const raw = localStorage.getItem(TOAST_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        localStorage.removeItem(TOAST_KEY);
        setReminderToast(data);
        clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => setReminderToast(null), 8000);
      } catch {
        localStorage.removeItem(TOAST_KEY);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { clearInterval(id); clearTimeout(dismissTimer); };
  }, []);

  // Pull in Jira issues assigned to the user (read-only) and merge them alongside local tasks.
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const jiraTasks = await fetchJiraTasks();
      if (cancelled) return;
      setTasks((prev) => [...prev.filter((t) => t.source !== "jira"), ...jiraTasks]);
    };
    sync();
    const id = setInterval(sync, JIRA_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Record today's visit for the Early Bird / Consistent-streak badges.
  useEffect(() => {
    recordAppVisit();
  }, []);

  // Poll localStorage every 5 s for badge-unlock signals written by src/lib/achievements.ts
  useEffect(() => {
    let dismissTimer: ReturnType<typeof setTimeout>;
    const check = () => {
      const raw = localStorage.getItem(BADGE_TOAST_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        localStorage.removeItem(BADGE_TOAST_KEY);
        setBadgeToast(data);
        clearTimeout(dismissTimer);
        dismissTimer = setTimeout(() => setBadgeToast(null), 8000);
      } catch {
        localStorage.removeItem(BADGE_TOAST_KEY);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { clearInterval(id); clearTimeout(dismissTimer); };
  }, []);

  const handleNavChange = (view: string) => {
    setCurrentView(view);
  };

  if (focusMode) {
    return <PixelTimer onExit={() => setFocusMode(false)} />;
  }

  const dateLabel = currentTime.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  return (
    <Box bg="#F7F1EA" minH="100vh" w="100%" pb={10}>
      <Container maxW="1400px" p={{ base: 4, md: 8 }}>
        <Box mb="18px">
          <RoomBanner />
        </Box>

        <Box display="flex" flexDirection={{ base: "column", lg: "row" }} gap="22px" alignItems="stretch" mb="22px">
          <Header currentTime={currentTime} setFocusMode={setFocusMode} />
          {currentView === "dashboard" && <TodaysTasksCard tasks={tasks} />}
        </Box>

        <Box
          display="flex"
          flexDirection={{ base: "column", sm: "row" }}
          alignItems={{ base: "flex-start", sm: "center" }}
          gap={{ base: "4px", sm: "10px" }}
          mb="14px"
        >
          <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "20px", sm: "26px" }} color="#C0577E" letterSpacing="1px" whiteSpace="nowrap">
            ˚♡ ⋅ ˚ MY ROOM ˚♡ ⋅ ˚
          </Text>
          <Box
            flex="1"
            h="6px"
            borderRadius="3px"
            display={{ base: "none", sm: "block" }}
            style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFC2DA 0 13px,transparent 13px 24px)" }}
          />
          <Text fontSize="12px" fontWeight="700" color="#B79ACB" whiteSpace="nowrap">
            {dateLabel}
          </Text>
        </Box>

        <Navbar currentView={currentView} setView={handleNavChange} onFocus={() => setFocusMode(true)} />

        {/* --- VIEW ROUTING --- */}
        {currentView === "dashboard" && (
          <Box
            display="grid"
            gridTemplateColumns={{
              base: "1fr",
              md: "1fr 1fr",
              lg: "1fr 1fr 1fr",
            }}
            gap={6}
            alignItems="start"
          >
            {/* ── Column 1: Tasks + Progress ── */}
            <Box display="flex" flexDirection="column" gap={6}>
              <TaskList tasks={tasks} setTasks={setTasks} />
              <ProgressTracker tasks={tasks} />
            </Box>

            {/* ── Column 2: Music + Weather ── */}
            <Box display="flex" flexDirection="column" gap={6}>
              <MusicPlayer />
              <WeatherWidget />
            </Box>

            {/* ── Column 3: Calendar + Sticky (lg+ only) ── */}
            <Box display={{ base: "none", lg: "flex" }} flexDirection="column" gap={6}>
              <CalendarWidget currentDate={currentTime} />
              <StickyNotes notes={notes} setNotes={setNotes} />
            </Box>

            {/* ── Below 2-col (md) and mobile: Calendar + Sticky side by side ── */}
            <Box
              display={{ base: "flex", lg: "none" }}
              gridColumn={{ md: "1 / -1" }}
              flexDirection={{ base: "column", md: "row" }}
              gap={6}
            >
              <Box flex={1}><CalendarWidget currentDate={currentTime} /></Box>
              <Box flex={1}><StickyNotes notes={notes} setNotes={setNotes} /></Box>
            </Box>
          </Box>
        )}
        {currentView === "journal" && (
          <Box animation="fade-in 0.5s ease-in-out">
            <Notebook />
          </Box>
        )}
        {currentView === "achievements" && <Achievements />}
        {currentView === "companions" && <Companions />}
        {currentView === "mood" && <MoodTracker />}
        {currentView === "games" && <Games />}
        {currentView === "finance" && <FinanceTracker />}
        {currentView === "learning" && <LearningTracker />}
        {currentView === "reminders" && <Reminders />}
      </Container>

      {/* ── Global reminder toast (fires on any view) ── */}
      {reminderToast && (
        <Box
          position="fixed"
          top="24px"
          left="50%"
          zIndex={9999}
          bg="white"
          borderRadius="2xl"
          px={5}
          py={4}
          boxShadow="0 8px 32px rgba(196,87,127,.22)"
          border="2px solid"
          borderColor="#FFDDEB"
          minW={{ base: "0", md: "280px" }}
          w={{ base: "90vw", md: "auto" }}
          maxW="380px"
          display="flex"
          alignItems="flex-start"
          gap={3}
          style={{ transform: "translateX(-50%)", animation: "ssToastIn 0.35s ease" }}
        >
          <Box fontSize="xl" flexShrink={0} lineHeight="1.4">⏰</Box>
          <Box flex={1} minW={0}>
            <Box as="span" fontSize="sm" fontWeight="900" color="#C0577E" display="block">
              {reminderToast.title}
            </Box>
            {reminderToast.note && (
              <Box as="span" fontSize="xs" color="gray.500" fontWeight="500" display="block" mt={0.5}>
                {reminderToast.note}
              </Box>
            )}
          </Box>
          <Box
            as="button"
            flexShrink={0}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "#d1d5db", fontSize: "20px", lineHeight: 1, padding: "0" }}
            onClick={() => setReminderToast(null)}
          >
            ×
          </Box>
        </Box>
      )}
      {/* ── Global badge-unlock toast (fires on any view) ── */}
      {badgeToast && (
        <Box
          position="fixed"
          bottom="24px"
          left="50%"
          zIndex={9999}
          bg="white"
          borderRadius="2xl"
          px={5}
          py={4}
          boxShadow="0 8px 32px rgba(196,87,127,.22)"
          border="2px solid"
          borderColor="#EEDCFB"
          minW={{ base: "0", md: "280px" }}
          w={{ base: "90vw", md: "auto" }}
          maxW="380px"
          display="flex"
          alignItems="center"
          gap={3}
          style={{ transform: "translateX(-50%)", animation: "ssBadgeToastIn 0.35s ease" }}
        >
          <Box fontSize="26px" flexShrink={0} lineHeight="1">{badgeToast.icon}</Box>
          <Box flex={1} minW={0}>
            <Box as="span" fontSize="xs" fontWeight="800" color="#8A6BD1" display="block" letterSpacing="1px" textTransform="uppercase">
              Badge unlocked
            </Box>
            <Box as="span" fontSize="sm" fontWeight="900" color="#C0577E" display="block">
              {badgeToast.name}
            </Box>
          </Box>
          <Box
            as="button"
            flexShrink={0}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "#d1d5db", fontSize: "20px", lineHeight: 1, padding: "0" }}
            onClick={() => setBadgeToast(null)}
          >
            ×
          </Box>
        </Box>
      )}
      <style>{`
        @keyframes ssToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ssBadgeToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default Dashboard;
