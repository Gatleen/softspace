import { Box, Text, Image, VStack, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

interface Subtask {
  completed: boolean;
}

interface Task {
  completed: boolean;
  subtasks?: Subtask[];
}

interface ProgressTrackerProps {
  tasks: Task[];
}

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
      borderRadius="3xl"
      border="1.5px solid"
      borderColor="pink.100"
      boxShadow="0 8px 32px rgba(255,182,193,0.15)"
      overflow="hidden"
    >
      {/* ── Gradient header ── */}
      <Box
        bg="linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)"
        px={6} pt={5} pb={5}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-20px" right="-20px" w="90px" h="90px"
          borderRadius="full" bg="whiteAlpha.100" />
        <Box position="absolute" bottom="-30px" left="20px" w="70px" h="70px"
          borderRadius="full" bg="whiteAlpha.100" />

        <HStack justify="space-between" position="relative">
          <HStack gap={3}>
            <Box
              w="42px" h="42px" borderRadius="xl"
              bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              <Image src="/icons/Award.png" alt="Award" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontSize="lg" fontWeight="900" color="white" lineHeight="1">
                Progress Tracker
              </Text>
              <Text fontSize="xs" color="whiteAlpha.800" fontWeight="bold">
                Lumi is cheering you on! 💕
              </Text>
            </VStack>
          </HStack>
          <Box
            px={3} py={1} borderRadius="full"
            bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
          >
            <Text fontSize="xs" fontWeight="800" color="white">
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
        mx="50px"
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
        mt={4} px={4} py={2} borderRadius="xl"
        bg={isFinish ? "orange.50" : "pink.50"}
        border="1px solid"
        borderColor={isFinish ? "orange.100" : "pink.100"}
        textAlign="center"
      >
        <Text fontSize="xs" fontWeight="800"
          color={isFinish ? "orange.500" : "pink.400"} fontStyle="italic">
          {isFinish
            ? "Lumi is so proud of your hard work! Stay sparkling! 🎀"
            : "Lumi is cheering you on every step of the way! 💕"}
        </Text>
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
