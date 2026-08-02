import { useState } from "react";
import { Box, Text, VStack, Center, Image, HStack, Circle } from "@chakra-ui/react";

const PLAYLIST_DATA = [
  {
    id: "lofi",
    name: "Go Gatleen!",
    embedUrl: "https://open.spotify.com/embed/playlist/2klSJisbPa74QBCgz9hu9X?utm_source=generator",
    image: "/GoGatleen!.png",
    color: "#B2E2F2",
  },
  {
    id: "piano",
    name: "Peaceful Piano",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX4sW36Cj2bdq",
    image: "https://i.scdn.co/image/ab67616d0000b273ca6505a5a98319692484555d",
    color: "#FFD1DC",
  },
  {
    id: "coffee",
    name: "Coffee Shop Jazz",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXbITWG1ZJKYp",
    image: "https://i.scdn.co/image/ab67616d0000b2733d9692d3f66c0d59218d6e35",
    color: "#FFF4BD",
  },
];

const MusicPlayer = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentTrack = PLAYLIST_DATA[currentIdx];

  return (
    <Box
      bg="white"
      borderRadius="24px"
      border="2.5px solid"
      borderColor="#EEDCFB"
      boxShadow="0 6px 0 rgba(205,180,246,.35)"
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
              <Image src="/icons/CD.png" alt="CD" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontFamily="'Jersey 25', cursive" fontSize="24px" color="white" letterSpacing=".6px" textShadow="0 2px 0 rgba(196,87,127,.3)" lineHeight="1.1">
                Now Vibe-ing
              </Text>
              <Text fontSize="10.5px" color="rgba(255,255,255,.9)" fontWeight="700">
                {currentTrack.name}
              </Text>
            </VStack>
          </HStack>
          <Text fontSize="16px" color="white">♡</Text>
        </HStack>
      </Box>

      {/* ── Vinyl + controls ── */}
      <Box px={6} py={5}>
        <VStack gap={5}>
          {/* Vinyl record */}
          <Center position="relative" py={2}>
            {/* Glow */}
            <Box
              position="absolute" w="210px" h="210px" borderRadius="full"
              style={{ background: `radial-gradient(circle, ${currentTrack.color}88 0%, transparent 70%)` }}
              filter="blur(18px)"
            />

            {/* Disc */}
            <Box
              w="210px" h="210px" borderRadius="full" position="relative"
              style={{
                animation: "vinyl-spin 4s linear infinite",
                background: `repeating-radial-gradient(
                  circle at center,
                  #1c1c1c 0px,  #1c1c1c 6px,
                  #2a2a2a 6px,  #2a2a2a 7px,
                  #1c1c1c 7px,  #1c1c1c 14px,
                  #252525 14px, #252525 15px
                )`,
                boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Shine */}
              <Box position="absolute" inset="0" borderRadius="full" style={{
                background: "conic-gradient(from 120deg, rgba(255,255,255,0.06) 0deg, transparent 60deg, rgba(255,255,255,0.03) 180deg, transparent 240deg)",
              }} />

              {/* Centre label */}
              <Box
                position="absolute" w="86px" h="86px" borderRadius="full"
                top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }}
                overflow="hidden" border="3px solid #111"
                boxShadow="0 0 0 2px rgba(255,255,255,0.1)" zIndex={2}
              >
                <Image src={currentTrack.image} alt="Cover" w="full" h="full" objectFit="cover" />
              </Box>

              {/* Spindle */}
              <Box
                position="absolute" w="12px" h="12px" borderRadius="full"
                bg="#0d0d0d" top="50%" left="50%"
                style={{ transform: "translate(-50%, -50%)" }}
                border="1px solid rgba(255,255,255,0.12)" zIndex={3}
              />
            </Box>

            {/* Tonearm */}
            <Box
              position="absolute" top="10px" right="12px"
              w="6px" h="80px"
              bg="linear-gradient(to bottom, #d4a0ff, #9b59b6)"
              borderRadius="full" boxShadow="0 2px 6px rgba(0,0,0,0.4)"
              style={{ transformOrigin: "top center", transform: "rotate(28deg)" }}
              zIndex={4}
            >
              <Box position="absolute" bottom="-6px" left="50%"
                style={{ transform: "translateX(-50%)" }}
                w="4px" h="8px" bg="#c084fc" borderRadius="full" />
            </Box>
          </Center>

          {/* Playlist dots */}
          <HStack gap={2}>
            {PLAYLIST_DATA.map((_, index) => (
              <Circle
                key={index}
                size={currentIdx === index ? "13px" : "9px"}
                bg={currentIdx === index ? "#B98BE8" : "#EEDCFB"}
                cursor="pointer"
                onClick={() => setCurrentIdx(index)}
                transition="all 0.2s"
                _hover={{ transform: "scale(1.2)" }}
              />
            ))}
          </HStack>

          {/* Hint */}
          <Text fontSize="11px" color="#C2AECF" fontWeight="700">
            Log in to Spotify for full songs ✧
          </Text>

          {/* Spotify embed */}
          <Box
            w="full" h="80px" borderRadius="2xl" overflow="hidden"
            border="1.5px solid" borderColor="purple.50"
            boxShadow="0 2px 8px rgba(109,40,217,0.08)"
          >
            <iframe
              src={currentTrack.embedUrl}
              width="100%" height="80"
              style={{ border: "none" }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Embed"
            />
          </Box>
        </VStack>
      </Box>

      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default MusicPlayer;