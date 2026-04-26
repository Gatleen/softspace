import { SimpleGrid, Box, Text, Badge, Image } from "@chakra-ui/react";
import { Lock } from "lucide-react";

// 🏆 Badge Data
// Add your own image paths to the `image` field (e.g. "/badges/first-step.png").
// If `image` is empty, the emoji `icon` is used as a fallback.
const BADGES = [
  // ── Task & Productivity ─────────────────────────────────────────────────────
  {
    id: 1,
    name: "First Step",
    desc: "Complete your very first task",
    icon: "🌱",
    image: "",
    unlocked: true,
    color: "green.100",
  },
  {
    id: 2,
    name: "Task Master",
    desc: "Complete 10 tasks total",
    icon: "✅",
    image: "",
    unlocked: false,
    color: "green.100",
  },
  {
    id: 3,
    name: "Star Collector",
    desc: "Star 5 important tasks",
    icon: "⭐",
    image: "",
    unlocked: false,
    color: "yellow.100",
  },
  // ── Focus / Pomodoro ────────────────────────────────────────────────────────
  {
    id: 4,
    name: "Focus Spark",
    desc: "Complete your first Pomodoro session",
    icon: "🍅",
    image: "",
    unlocked: false,
    color: "red.100",
  },
  {
    id: 5,
    name: "Deep Focus",
    desc: "Complete 10 Pomodoro sessions",
    icon: "🔥",
    image: "",
    unlocked: false,
    color: "orange.100",
  },
  {
    id: 6,
    name: "Break Taker",
    desc: "Use a break mode in the Pomodoro timer",
    icon: "☕",
    image: "",
    unlocked: false,
    color: "brown.100",
  },
  // ── Journal / Notes ─────────────────────────────────────────────────────────
  {
    id: 7,
    name: "Journalist",
    desc: "Write your first journal entry",
    icon: "✍️",
    image: "",
    unlocked: true,
    color: "blue.100",
  },
  {
    id: 8,
    name: "Dear Diary",
    desc: "Write 7 journal entries",
    icon: "📔",
    image: "",
    unlocked: false,
    color: "blue.100",
  },
  {
    id: 9,
    name: "Sticky Fingers",
    desc: "Add your first sticky note",
    icon: "📝",
    image: "",
    unlocked: false,
    color: "pink.100",
  },
  // ── Mood ────────────────────────────────────────────────────────────────────
  {
    id: 10,
    name: "Mood Check-In",
    desc: "Log your mood for the first time",
    icon: "😊",
    image: "",
    unlocked: false,
    color: "pink.100",
  },
  {
    id: 11,
    name: "Emotionally Aware",
    desc: "Log 7 different mood entries",
    icon: "🌈",
    image: "",
    unlocked: false,
    color: "purple.100",
  },
  // ── Learning ────────────────────────────────────────────────────────────────
  {
    id: 12,
    name: "Lifelong Learner",
    desc: "Add your first course or project",
    icon: "📚",
    image: "",
    unlocked: false,
    color: "purple.100",
  },
  {
    id: 13,
    name: "Course Complete",
    desc: "Mark a learning project as Done",
    icon: "🎓",
    image: "",
    unlocked: false,
    color: "purple.100",
  },
  {
    id: 14,
    name: "Certified",
    desc: "Earn a certificate for a completed course",
    icon: "🏅",
    image: "",
    unlocked: false,
    color: "yellow.100",
  },
  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    id: 15,
    name: "Money Moves",
    desc: "Log your first transaction",
    icon: "💸",
    image: "",
    unlocked: false,
    color: "green.100",
  },
  {
    id: 16,
    name: "Goal Setter",
    desc: "Create your first savings goal",
    icon: "🎯",
    image: "",
    unlocked: false,
    color: "teal.100",
  },
  {
    id: 17,
    name: "Dream Achieved",
    desc: "Reach 100% on a savings goal",
    icon: "🏆",
    image: "",
    unlocked: false,
    color: "yellow.100",
  },
  // ── Social / Companions ─────────────────────────────────────────────────────
  {
    id: 18,
    name: "New Friend",
    desc: "Visit the Friends page for the first time",
    icon: "🦋",
    image: "",
    unlocked: false,
    color: "pink.100",
  },
  {
    id: 19,
    name: "Social Butterfly",
    desc: "View all your companions",
    icon: "🌸",
    image: "",
    unlocked: false,
    color: "pink.100",
  },
  // ── Time & Consistency ──────────────────────────────────────────────────────
  {
    id: 20,
    name: "Early Bird",
    desc: "Open SoftSpace before 8 AM",
    icon: "☀️",
    image: "",
    unlocked: false,
    color: "orange.100",
  },
  {
    id: 21,
    name: "Night Owl",
    desc: "Complete a task after 10 PM",
    icon: "🌙",
    image: "",
    unlocked: false,
    color: "indigo.100",
  },
  {
    id: 22,
    name: "Consistent",
    desc: "Use SoftSpace 5 days in a row",
    icon: "🔑",
    image: "",
    unlocked: false,
    color: "cyan.100",
  },
];

const Achievements = () => {
  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={2} textAlign="center" color="purple.800">
        🏆 Your Hall of Fame
      </Text>
      <Text fontSize="sm" textAlign="center" color="gray.400" fontWeight="600" mb={6}>
        {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} unlocked
      </Text>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={5}>
        {BADGES.map((badge) => (
          <Box
            key={badge.id}
            bg={badge.unlocked ? "white" : "gray.100"}
            p={5}
            borderRadius="2xl"
            boxShadow={badge.unlocked ? "md" : "none"}
            border="2px solid"
            borderColor={badge.unlocked ? "transparent" : "gray.200"}
            textAlign="center"
            opacity={badge.unlocked ? 1 : 0.65}
            transition="transform 0.2s"
            _hover={{ transform: badge.unlocked ? "scale(1.05)" : "none" }}
            position="relative"
            overflow="hidden"
          >
            {/* Icon / Image circle */}
            <Box
              w="72px"
              h="72px"
              mx="auto"
              bg={badge.unlocked ? badge.color : "gray.200"}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              mb={3}
              overflow="hidden"
            >
              {badge.unlocked ? (
                badge.image ? (
                  <Image src={badge.image} alt={badge.name} w="52px" h="52px" objectFit="contain" />
                ) : (
                  <span>{badge.icon}</span>
                )
              ) : (
                <Lock size={22} color="#A0AEC0" />
              )}
            </Box>

            <Text fontWeight="bold" fontSize="sm" color={badge.unlocked ? "gray.800" : "gray.500"} lineHeight="1.3">
              {badge.name}
            </Text>

            <Text fontSize="xs" color="gray.400" mt={1} lineHeight="1.4">
              {badge.desc}
            </Text>

            {badge.unlocked && (
              <Badge
                position="absolute"
                top="8px"
                right="8px"
                colorPalette="green"
                variant="solid"
                size="sm"
              >
                ✓
              </Badge>
            )}
          </Box>
        ))}
      </SimpleGrid>

      <Box mt={6} p={4} bg="purple.50" borderRadius="2xl" border="1px dashed" borderColor="purple.200">
        <Text fontSize="xs" fontWeight="700" color="purple.400" textAlign="center">
          💡 To use custom badge images, add PNG files to <Box as="code" bg="purple.100" px={1} borderRadius="sm">/public/badges/</Box> and set the <Box as="code" bg="purple.100" px={1} borderRadius="sm">image</Box> field in <Box as="code" bg="purple.100" px={1} borderRadius="sm">Achievements.tsx</Box>
        </Text>
      </Box>
    </Box>
  );
};

export default Achievements;
