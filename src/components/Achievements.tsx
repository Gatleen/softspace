import { Box, Text, Image } from "@chakra-ui/react";
import SectionHeader from "./ui/SectionHeader";

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

// Cycled per badge index (only applied to unlocked badges — locked ones stay flat/neutral)
const UNLOCKED_TINTS = ["#FFF0F6", "#F6F0FF", "#F1F8FE", "#FFFBF0"];
const ROTATIONS = ["-2.5deg", "1.8deg", "-1.2deg", "2.4deg", "-1.8deg"];
const LOCKED_TINT = "#F6F2F4";

const Achievements = () => {
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <Box>
      <SectionHeader
        title="Your Hall of Fame"
        meta={`${unlockedCount} / ${BADGES.length} unlocked · earned ones are downloadable stickers`}
      />

      <Box
        display="flex"
        alignItems="center"
        px="16px"
        py="9px"
        borderRadius="16px"
        background="#FFFBF0"
        border="2px solid #FBEFCF"
        fontSize="11.5px"
        fontWeight="700"
        color="#C99A3E"
        mb="22px"
      >
        Drop your own art onto any earned sticker — it keeps the white die-cut outline
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }}
        gap="22px"
      >
        {BADGES.map((badge, i) => {
          const tint = badge.unlocked ? UNLOCKED_TINTS[i % UNLOCKED_TINTS.length] : LOCKED_TINT;
          const rotation = badge.unlocked ? ROTATIONS[i % ROTATIONS.length] : "0deg";
          const border = badge.unlocked ? "#FFDDEB" : "#EFE7EC";

          return (
            <Box key={badge.id}>
              <Box
                p="9px"
                borderRadius="28px"
                background="white"
                style={{ transform: `rotate(${rotation})` }}
                boxShadow={`0 0 0 2.5px ${border},0 8px 0 rgba(255,199,222,.4),0 14px 24px rgba(196,87,127,.1)`}
                opacity={badge.unlocked ? 1 : 0.62}
              >
                <Box borderRadius="21px" background={tint} px="14px" pt="16px" pb="12px" textAlign="center">
                  {badge.unlocked ? (
                    <Box
                      w="86px"
                      h="86px"
                      mx="auto"
                      borderRadius="999px"
                      bg="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 0 0 4px #fff,0 0 0 6px rgba(255,255,255,.9),0 4px 10px rgba(196,87,127,.15)"
                    >
                      {badge.image ? (
                        <Image src={badge.image} alt={badge.name} w="56px" h="56px" objectFit="contain" />
                      ) : (
                        <Text fontSize="40px" lineHeight="1">
                          {badge.icon}
                        </Text>
                      )}
                    </Box>
                  ) : (
                    <Box
                      w="86px"
                      h="86px"
                      mx="auto"
                      borderRadius="999px"
                      bg="#EFE9EC"
                      border="3px solid white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      style={{ filter: "grayscale(1)" }}
                    >
                      <Text fontSize="34px" lineHeight="1">
                        🔒
                      </Text>
                    </Box>
                  )}

                  <Text
                    fontFamily="'Jersey 25', cursive"
                    fontSize="24px"
                    color={badge.unlocked ? "#C0577E" : "#C2B4BD"}
                    mt="10px"
                  >
                    {badge.name}
                  </Text>

                  <Text
                    fontSize="11.5px"
                    fontWeight="600"
                    color={badge.unlocked ? "#A08B9B" : "#C7BCC4"}
                    mt="3px"
                    minH="32px"
                  >
                    {badge.desc}
                  </Text>

                  <Box
                    mt="10px"
                    pt="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap="6px"
                    style={{ borderTop: "2px dotted rgba(255,255,255,.9)" }}
                  >
                    <Image src="/Llama1.png" alt="" boxSize="18px" objectFit="contain" />
                    <Text fontFamily="'Jersey 25', cursive" fontSize="16px" color="#C9A6D9">
                      SoftSpace
                    </Text>
                  </Box>
                </Box>
              </Box>

              {badge.unlocked ? (
                <Box
                  as="button"
                  mt="10px"
                  w="full"
                  py="8px"
                  borderRadius="999px"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                  border="2px solid white"
                  boxShadow="0 4px 0 rgba(196,87,127,.2)"
                  fontFamily="'Jersey 25', cursive"
                  fontSize="14px"
                  color="white"
                  textAlign="center"
                  cursor="pointer"
                  style={{ textShadow: "0 2px 0 rgba(196,87,127,.3)" }}
                >
                  ⤓ Download sticker
                </Box>
              ) : (
                <Box
                  mt="10px"
                  w="full"
                  py="8px"
                  borderRadius="999px"
                  background="#F4F1F3"
                  textAlign="center"
                  fontSize="12px"
                  fontWeight="700"
                  color="#B7A9B1"
                >
                  locked
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Achievements;
