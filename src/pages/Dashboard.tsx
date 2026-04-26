import { useEffect, useState } from "react";
import { Box, Container, Image } from "@chakra-ui/react";
import BannerImg from "../assets/SoftSpace Banner.png";

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
}

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [focusMode, setFocusMode] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [reminderToast, setReminderToast] = useState<{ id: string; title: string; note?: string } | null>(null);

  // Sample Data
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Review React basics", completed: false, priority: "high", createdAt: Date.now(), tags: [], starred: false, archived: false, subtasks: [] },
    { id: 2, text: "Practice CSS styling", completed: true, priority: "medium", createdAt: Date.now(), tags: [], starred: false, archived: false, subtasks: [] },
  ]);

  const [notes, setNotes] = useState([
    {
      id: 1,
      text: "Take breaks 🌸",
      bgColor: "pink.100",
      textColor: "gray.800",
    },
    {
      id: 2,
      text: "30 mins coding ✨",
      bgColor: "purple.100",
      textColor: "purple.900",
    },
  ]);

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

  // 💡 NAVIGATION LOGIC
  // We no longer need isNotebookOpen state because the "journal" view
  // is just another string in currentView.
  const handleNavChange = (view: string) => {
    setCurrentView(view);
  };

  if (focusMode) {
    return <PixelTimer onExit={() => setFocusMode(false)} />;
  }

  return (
    <Box
      bg="linear-gradient(to bottom right, var(--chakra-colors-pink-50), var(--chakra-colors-purple-50))"
      minH="100vh"
      w="100%"
      pb={10} // Added padding at bottom for better feel
    >
      <Container maxW="1400px" p={{ base: 4, md: 8 }}>
        {/* Banner */}
        <Box
          w="100%"
          borderRadius="2xl"
          overflow="hidden"
          mb={6}
          boxShadow="md"
          bg="blackAlpha.200"
        >
          <Image
            src={BannerImg}
            alt="Dashboard Banner"
            w="100%"
            h="auto"
            maxH="300px"
            objectFit="cover"
            display="block"
          />
        </Box>
        <Header currentTime={currentTime} setFocusMode={setFocusMode} />

        {/* Today's Tasks Strip */}
        {currentView === "dashboard" && (
          <Box
            bg="white"
            borderRadius="2xl"
            px={6}
            py={4}
            mb={4}
            boxShadow="0 4px 16px rgba(168,85,247,0.08)"
            border="1.5px solid"
            borderColor="purple.100"
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box w="8px" h="8px" borderRadius="full" bg="purple.400" flexShrink={0} />
              <Box as="span" fontSize="xs" fontWeight="800" color="purple.500" letterSpacing="wider">
                TODAY'S TASKS
              </Box>
              <Box
                as="span"
                ml="auto"
                fontSize="xs"
                fontWeight="700"
                color="gray.400"
              >
                {tasks.filter((t) => !t.completed && !t.archived).length} remaining
              </Box>
            </Box>
            {tasks.filter((t) => !t.archived).length === 0 ? (
              <Box as="span" fontSize="sm" color="gray.400">
                No tasks yet — add some from the task list below ✨
              </Box>
            ) : (
              <Box
                display="flex"
                flexWrap="wrap"
                gap={2}
              >
                {tasks
                  .filter((t) => !t.archived)
                  .slice(0, 8)
                  .map((task) => (
                    <Box
                      key={task.id}
                      display="inline-flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg={task.completed ? "green.50" : task.priority === "high" ? "red.50" : task.priority === "medium" ? "orange.50" : "purple.50"}
                      border="1.5px solid"
                      borderColor={task.completed ? "green.200" : task.priority === "high" ? "red.200" : task.priority === "medium" ? "orange.200" : "purple.100"}
                      opacity={task.completed ? 0.6 : 1}
                    >
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        flexShrink={0}
                        bg={task.completed ? "green.400" : task.priority === "high" ? "red.400" : task.priority === "medium" ? "orange.400" : "purple.300"}
                      />
                      <Box
                        as="span"
                        fontSize="xs"
                        fontWeight="700"
                        color={task.completed ? "gray.400" : "gray.700"}
                        textDecoration={task.completed ? "line-through" : "none"}
                        maxW="160px"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {task.text}
                      </Box>
                    </Box>
                  ))}
                {tasks.filter((t) => !t.archived).length > 8 && (
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    bg="gray.50"
                    border="1.5px solid"
                    borderColor="gray.200"
                  >
                    <Box as="span" fontSize="xs" fontWeight="700" color="gray.400">
                      +{tasks.filter((t) => !t.archived).length - 8} more
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* 🧭 The Navbar controls which string is set to currentView */}
        <Navbar currentView={currentView} setView={handleNavChange} />
        {/* --- VIEW ROUTING --- */}
        {/* 1. DASHBOARD VIEW */}
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
        {/* 2. JOURNAL VIEW */}
        {currentView === "journal" && (
          <Box animation="fade-in 0.5s ease-in-out">
            <Notebook />
          </Box>
        )}
        {/* 3. ACHIEVEMENTS VIEW */}
        {currentView === "achievements" && <Achievements />}
        {/* 4. COMPANIONS VIEW */}
        {currentView === "companions" && <Companions />}
        {/* 5. MOOD PICKER (If you have one) */}
        {currentView === "mood" && <MoodTracker />}{" "}
        {/* Assuming you have a MoodPicker component */}
        {/* 6. GAMES VIEW (If you have one) */}
        {currentView === "games" && <Games />}
        {/* 7. FINANCE VIEW */}
        {currentView === "finance" && <FinanceTracker />}
        {/* 8. LEARNING VIEW */}
        {currentView === "learning" && <LearningTracker />}
        {/* 9. REMINDERS VIEW */}
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
          boxShadow="0 8px 32px rgba(168,85,247,0.22)"
          border="2px solid"
          borderColor="pink.200"
          minW="280px"
          maxW="380px"
          display="flex"
          alignItems="flex-start"
          gap={3}
          style={{ transform: "translateX(-50%)", animation: "ssToastIn 0.35s ease" }}
        >
          <Box fontSize="xl" flexShrink={0} lineHeight="1.4">⏰</Box>
          <Box flex={1} minW={0}>
            <Box as="span" fontSize="sm" fontWeight="900" color="purple.600" display="block">
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
      <style>{`
        @keyframes ssToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default Dashboard;
