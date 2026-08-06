import { Box, Text, Image, VStack, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { STATUS_CONFIG, STATUS_STYLE } from "../lib/taskStatus";
import type { Task, TaskStatus } from "../types/task";

interface ProgressTrackerProps {
  tasks: Task[];
}

const STATUS_ORDER: TaskStatus[] = ["not_started", "in_progress", "done"];

const ProgressTracker = ({ tasks }: ProgressTrackerProps) => {
  // Count each subtask individually; tasks without subtasks count as 1 item
  const total = tasks.reduce(
    (sum, t) => sum + (t.subtasks?.length ? t.subtasks.length : 1),
    0
  );
  const completed = tasks.reduce((sum, t) => {
    if (t.subtasks?.length)
      return sum + t.subtasks.filter((s) => s.completed).length;
    return sum + (t.completed ? 1 : 0);
  }, 0);
  const progressValue = total === 0 ? 0 : (completed / total) * 100;

  const activeTasks = tasks.filter((t) => !t.archived);
  const statusData = STATUS_ORDER.map((status) => ({
    status,
    name: STATUS_CONFIG[status].label,
    value: activeTasks.filter((t) => t.status === status).length,
    color: STATUS_STYLE[status].color,
  })).filter((d) => d.value > 0);

  const getMascotImage = () => {
    if (progressValue === 0) return "/LumiStart.png";
    if (progressValue === 100) return "/LumiFinish.png";
    return "/LumiInProgress.png";
  };

  // 🛠️ Adjust size for LumiFinish specifically if it feels too small
  const isFinish = progressValue === 100;
  const mascotSize = isFinish ? "100px" : "80px"; // Give the finish image a boost

  return (
    <Box
      bg="white"
      borderRadius="24px"
      border="2.5px solid"
      borderColor="#FFDDEB"
      boxShadow="0 6px 0 rgba(255,199,222,.45)"
      overflow="hidden"
    >
      {/* ── Gradient header ── */}
      <Box
        background="linear-gradient(135deg,#FFC2DA,#D9BFF7)"
        px={5} pt={4} pb={4}
        position="relative"
        overflow="hidden"
      >
        <HStack justify="space-between" position="relative">
          <HStack gap={3}>
            <Box
              w="42px" h="42px" borderRadius="14px"
              bg="rgba(255,255,255,.35)"
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              <Image src="/icons/Award.png" alt="Award" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontFamily="'Jersey 25', cursive" fontSize="24px" color="white" letterSpacing=".6px" textShadow="0 2px 0 rgba(196,87,127,.3)" lineHeight="1.1">
                Progress Tracker
              </Text>
              <Text fontSize="10.5px" color="rgba(255,255,255,.9)" fontWeight="700">
                Lumi is cheering you on! 💕
              </Text>
            </VStack>
          </HStack>
          <Box
            px="12px" py="5px" borderRadius="999px"
            bg="rgba(255,255,255,.4)"
          >
            <Text fontSize="11px" fontWeight="800" color="white">
              {completed}/{total} done
            </Text>
          </Box>
        </HStack>
      </Box>

      <Box px={6} pt={4} pb={5}>
      {/* 🐾 The Mascot Track Area */}
      <Box
        position="relative"
        h="110px"
        mb={2}
        mx={{ base: "20px", md: "50px" }}
      >
        <motion.div
          initial={false}
          animate={{ left: `${progressValue}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{
            position: "absolute",
            bottom: "0px",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
          <VStack gap={0}>
            {isFinish && (
              <Box
                bg="pink.200"
                right="-20px"
                color="pink.600"
                px={3}
                py={1}
                rounded="full"
                fontSize="xs"
                fontWeight="bold"
                mb={1}
                boxShadow="0 4px 10px rgba(255, 105, 180, 0.3)"
              >
                Done!
              </Box>
            )}
            <Image
              src={getMascotImage()}
              alt="Lumi Mascot"
              w={mascotSize} // ✨ Dynamically larger for the finish state
              h={mascotSize}
              objectFit="contain"
              imageRendering="pixelated"
              transition="all 0.3s ease-in-out"
            />
          </VStack>
        </motion.div>

        {/* The Progress Bar Track */}
        <Box
          position="absolute"
          bottom="12px"
          left="0"
          right="0"
          h="18px"
          bg="pink.50"
          borderRadius="full"
          border="2px solid white"
          overflow="hidden"
          boxShadow="inner"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #FFD1DC 0%, #FF69B4 100%)",
              borderRadius: "inherit",
              boxShadow: "0 0 15px rgba(255, 105, 180, 0.6)",
            }}
          />
        </Box>
      </Box>

      {/* Motivational message */}
      <Box
        mt={4} px="16px" py="9px" borderRadius="14px"
        bg="#FFF0F6"
        border="1.5px solid #FFDDEB"
        textAlign="center"
      >
        <Text fontSize="11.5px" fontWeight="800"
          color="#F27DAB" fontStyle="italic">
          {isFinish
            ? "Lumi is so proud of your hard work! Stay sparkling! 🎀"
            : "Lumi is cheering you on every step of the way! 💕"}
        </Text>
      </Box>

      {/* Task status breakdown */}
      <Box mt={5} pt={4} borderTop="2px dashed #FFE4EF">
        <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#B79ACB" textAlign="center" mb="8px">
          STATUS BREAKDOWN
        </Text>
        {activeTasks.length === 0 ? (
          <Text textAlign="center" color="#C2AECF" py="16px" fontSize="12.5px" fontWeight="600">
            No tasks yet — add one on the Tasks page 🌸
          </Text>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v) => { const n = Number(v); return `${n} task${n === 1 ? "" : "s"}`; }} />
              </PieChart>
            </ResponsiveContainer>
            <Box display="flex" justifyContent="center" gap="16px" mt="8px" flexWrap="wrap">
              {statusData.map((d) => (
                <Box key={d.status} display="flex" alignItems="center" gap="6px">
                  <Box w="9px" h="9px" borderRadius="full" style={{ background: d.color }} />
                  <Text fontSize="11.5px" fontWeight="700" color="#5C4A63">{d.name}</Text>
                  <Text fontSize="11.5px" color="#A08B9B">{d.value}</Text>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
      </Box>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </Box>
  );
};

export default ProgressTracker;
