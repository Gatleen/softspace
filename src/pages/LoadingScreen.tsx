import { useEffect, useState } from "react";
import { Box, VStack, Text, Image } from "@chakra-ui/react";

const MESSAGES = [
  "Gathering your stars...",
  "Fluffing the clouds...",
  "Brewing something cozy...",
  "Warming up your space...",
  "Almost ready...",
  "Welcome home ✨",
];

const JERSEY = "'Jersey 25', cursive";

interface Props {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: Props) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Drive progress bar
  useEffect(() => {
    const start = performance.now();
    const duration = 2800;

    const tick = (now: number) => {
      const pct = Math.min(((now - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // Brief pause at 100%, then fade out
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onComplete, 500);
        }, 300);
      }
    };

    requestAnimationFrame(tick);
  }, [onComplete]);

  // Cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 480);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      position="fixed"
      inset="0"
      background="linear-gradient(160deg,#E7DEFB 0%,#F6E3F1 45%,#FFF1F7 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      opacity={fadeOut ? 0 : 1}
      transition="opacity 0.5s ease"
      overflow="hidden"
    >
      {/* Decorative blobs */}
      <Box position="absolute" top="-140px" left="-120px" w="380px" h="380px"
        borderRadius="999px" bg="whiteAlpha.600" opacity={0.5} pointerEvents="none" />
      <Box position="absolute" bottom="-160px" right="-130px" w="340px" h="340px"
        borderRadius="999px" bg="whiteAlpha.600" opacity={0.45} pointerEvents="none" />

      {/* Twinkling stars */}
      {[
        { top: "10%", left: "8%", size: "26px", color: "#F9A8CB", anim: "ss-twinkle 2.6s ease-in-out infinite" },
        { top: "18%", left: "86%", size: "20px", color: "#CDB4F6", anim: "ss-twinkle 3s ease-in-out infinite .4s" },
        { top: "78%", left: "12%", size: "22px", color: "#BDE0FE", anim: "ss-twinkle 2.2s ease-in-out infinite .8s" },
        { top: "70%", left: "88%", size: "18px", color: "#F9A8CB", anim: "ss-twinkle 2.8s ease-in-out infinite .2s" },
        { top: "40%", left: "5%", size: "14px", color: "#CDB4F6", anim: "ss-twinkle 2.4s ease-in-out infinite 1s" },
      ].map((s, i) => (
        <Box key={i} position="absolute" top={s.top} left={s.left} fontSize={s.size}
          color={s.color} style={{ animation: s.anim }} pointerEvents="none">
          ✧
        </Box>
      ))}

      <VStack gap="24px" zIndex={1} align="center" px={6}>
        {/* Mascot */}
        <Box
          style={{ animation: "ss-float 2.4s ease-in-out infinite" }}
          filter="drop-shadow(0 14px 22px rgba(122,90,160,.3))"
        >
          <Image
            src="/LumiInProgress.png"
            alt="Loading mascot"
            w={{ base: "140px", md: "180px" }}
            h="auto"
          />
        </Box>

        {/* Cycling message as the headline */}
        <Text
          fontFamily={JERSEY}
          fontSize={{ base: "32px", md: "44px" }}
          lineHeight="1.1"
          color="#C0577E"
          textAlign="center"
          minH={{ base: "36px", md: "48px" }}
          transition="opacity 0.3s ease"
        >
          {MESSAGES[msgIndex]}
        </Text>

        {/* Progress bar */}
        <VStack gap="8px" w={{ base: "260px", md: "340px" }}>
          <Box
            w="full"
            h="22px"
            background="white"
            borderRadius="999px"
            border="3px solid #FFC8DE"
            boxShadow="0 5px 0 rgba(196,87,127,.15)"
            overflow="hidden"
          >
            <Box
              h="full"
              borderRadius="999px"
              w={`${progress}%`}
              transition="width 0.05s linear"
              background="linear-gradient(90deg,#FFC2DA,#CDB4F6,#BDE0FE)"
            />
          </Box>

          <Text
            fontSize="12px"
            fontWeight="800"
            letterSpacing="2px"
            color="#B79ACB"
          >
            {Math.round(progress)}%
          </Text>
        </VStack>

        {/* Step rows */}
        <VStack gap="6px" align="flex-start">
          {MESSAGES.map((msg, i) => {
            const done = i < msgIndex;
            const active = i === msgIndex;
            return (
              <Box key={msg} display="flex" alignItems="center" gap="8px">
                <Box
                  w="7px" h="7px" borderRadius="999px"
                  background={done || active ? "#F27DAB" : "transparent"}
                  border={done || active ? "none" : "1.5px solid #C2AECF"}
                  opacity={active ? 1 : done ? 0.85 : 0.5}
                  flexShrink={0}
                />
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  color={done || active ? "#8A7690" : "#C2AECF"}
                  opacity={done || active ? 1 : 0.7}
                >
                  {msg}
                </Text>
              </Box>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
};

export default LoadingScreen;
