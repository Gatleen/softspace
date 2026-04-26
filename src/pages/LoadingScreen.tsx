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
      bg="linear-gradient(to bottom right, #ABA7E3, #A677CA, #4525A2)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      opacity={fadeOut ? 0 : 1}
      transition="opacity 0.5s ease"
      overflow="hidden"
    >
      {/* Floating pixel stars */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(12deg); }
        }
        @keyframes float-med {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-8deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes bounce-llama {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        .star { position: absolute; pointer-events: none; user-select: none; }
      `}</style>

      {/* Background pixel decorations */}
      {[
        { top: "8%",  left: "6%",  size: "28px", delay: "0s",    anim: "float-slow 4s ease-in-out infinite" },
        { top: "15%", left: "85%", size: "20px", delay: "0.5s",  anim: "float-med 3.5s ease-in-out infinite" },
        { top: "70%", left: "10%", size: "24px", delay: "1s",    anim: "float-slow 5s ease-in-out infinite" },
        { top: "75%", left: "88%", size: "18px", delay: "0.3s",  anim: "float-med 4.5s ease-in-out infinite" },
        { top: "40%", left: "4%",  size: "14px", delay: "0.8s",  anim: "twinkle 2s ease-in-out infinite" },
        { top: "35%", left: "92%", size: "16px", delay: "0.2s",  anim: "twinkle 2.5s ease-in-out infinite" },
        { top: "55%", left: "50%", size: "12px", delay: "1.2s",  anim: "twinkle 1.8s ease-in-out infinite" },
        { top: "20%", left: "45%", size: "10px", delay: "0.6s",  anim: "twinkle 3s ease-in-out infinite" },
      ].map((s, i) => (
        <Box
          key={i}
          className="star"
          top={s.top}
          left={s.left}
          fontSize={s.size}
          style={{ animation: s.anim, animationDelay: s.delay }}
        >
          {["✦", "✧", "★", "✨", "⋆"][i % 5]}
        </Box>
      ))}

      <VStack gap={6} zIndex={1} align="center" px={6}>
        {/* Llama mascot */}
        <Box
          style={{ animation: "bounce-llama 2s ease-in-out infinite" }}
          filter="drop-shadow(0px 16px 32px rgba(0,0,0,0.35))"
        >
          <Image
            src="/Llama1.png"
            alt="Loading mascot"
            w={{ base: "120px", md: "160px" }}
            h="auto"
          />
        </Box>

        {/* Title */}
        <VStack gap={1}>
          <Text
            fontSize={{ base: "4xl", md: "5xl" }}
            fontWeight="black"
            color="white"
            letterSpacing="tight"
            lineHeight="1"
            textShadow="0px 4px 12px rgba(0,0,0,0.25)"
          >
            SoftSpace
          </Text>
          <Text
            fontSize={{ base: "xs", md: "sm" }}
            color="whiteAlpha.800"
            letterSpacing="widest"
            textTransform="uppercase"
          >
            Your Digital Sanctuary
          </Text>
        </VStack>

        {/* Progress bar */}
        <Box w={{ base: "260px", md: "340px" }}>
          {/* Track */}
          <Box
            w="full"
            h="18px"
            bg="whiteAlpha.200"
            borderRadius="full"
            border="2px solid"
            borderColor="whiteAlpha.400"
            overflow="hidden"
            p="2px"
          >
            {/* Fill */}
            <Box
              h="full"
              borderRadius="full"
              w={`${progress}%`}
              transition="width 0.05s linear"
              style={{
                background:
                  "linear-gradient(90deg, #e9b8f7, #f9a8d4, #c084fc, #e9b8f7)",
                backgroundSize: "200% auto",
                animation: "shimmer 1.5s linear infinite",
              }}
            />
          </Box>

          {/* Percentage */}
          <Text
            textAlign="right"
            fontSize="xs"
            color="whiteAlpha.700"
            mt={1}
            fontWeight="bold"
          >
            {Math.round(progress)}%
          </Text>
        </Box>

        {/* Cycling message */}
        <Text
          fontSize={{ base: "md", md: "lg" }}
          color="whiteAlpha.900"
          fontWeight="bold"
          textAlign="center"
          minH="28px"
          transition="opacity 0.3s ease"
        >
          {MESSAGES[msgIndex]}
        </Text>
      </VStack>
    </Box>
  );
};

export default LoadingScreen;