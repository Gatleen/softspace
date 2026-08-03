import { Box, Image, Text } from "@chakra-ui/react";

const FLAG_COLORS = ["#FFC2DA", "#FFF3D6", "#FFFFFF", "#CDB4F6", "#BDE0FE", "#FFD9E8", "#FFF3D6"];
const FLAG_COUNT = 15;

const FLAGS = Array.from({ length: FLAG_COUNT }, (_, i) => {
  const t = i / (FLAG_COUNT - 1);
  const sag = Math.sin(t * Math.PI);
  return {
    key: i,
    color: FLAG_COLORS[i % FLAG_COLORS.length],
    top: (10 + sag * 26).toFixed(1) + "px",
    rot: ((t - 0.5) * -16).toFixed(1) + "deg",
    height: (38 + sag * 10).toFixed(0) + "px",
    delay: (i * 0.13).toFixed(2) + "s",
  };
});

/** The decorated "room" banner atop the Dashboard: pastel sky, bunting flags, clouds, twinkling stars and the SoftSpace signboard. */
const RoomBanner = () => {
  return (
    <Box
      position="relative"
      h={{ base: "150px", sm: "185px", md: "230px" }}
      overflow="hidden"
      borderRadius="24px"
      background="linear-gradient(180deg,#FFD9E8 0%,#FFE9F1 55%,#FFF4F8 100%)"
    >
      <Box
        position="absolute"
        inset="0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 46px,transparent 46px 92px)",
        }}
      />

      <svg
        viewBox="0 0 1400 90"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "90px" }}
      >
        <path d="M0 6 Q 700 74 1400 6" fill="none" stroke="#F48BB4" strokeWidth={4} strokeLinecap="round" />
        <path d="M0 22 Q 700 96 1400 22" fill="none" stroke="#E6C7F2" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      </svg>

      <Box position="absolute" top="0" left="0" right="0" display="flex" justifyContent="space-between" alignItems="flex-start" px={{ base: "10px", md: "26px" }}>
        {FLAGS.map((f) => (
          <Box
            key={f.key}
            mt={f.top}
            w={{ base: "10px", md: "30px" }}
            h={f.height}
            bg={f.color}
            style={{
              clipPath: "polygon(0 0,100% 0,50% 100%)",
              transformOrigin: "top center",
              transform: `rotate(${f.rot})`,
              animation: `ss-sway 4.5s ease-in-out infinite`,
              animationDelay: f.delay,
            }}
            boxShadow="0 3px 6px rgba(196,87,127,.12)"
          />
        ))}
      </Box>

      {/* Decorative clouds/stars: raw pixel-positioned, so only show once there's enough room */}
      <Box
        display={{ base: "none", md: "block" }}
        position="absolute"
        left="120px"
        top="96px"
        w="120px"
        h="44px"
        bg="white"
        borderRadius="999px"
        boxShadow="34px -16px 0 -6px #fff, 72px 4px 0 -10px #fff"
      />
      <Box
        display={{ base: "none", md: "block" }}
        position="absolute"
        right="150px"
        top="112px"
        w="140px"
        h="50px"
        bg="white"
        borderRadius="999px"
        boxShadow="-40px -18px 0 -8px #fff, -84px 6px 0 -12px #fff"
      />
      <Box display={{ base: "none", md: "block" }} position="absolute" left="56px" top="150px" fontSize="26px" color="white" style={{ animation: "ss-twinkle 2.6s ease-in-out infinite" }}>✧</Box>
      <Box display={{ base: "none", md: "block" }} position="absolute" right="70px" top="66px" fontSize="20px" color="white" style={{ animation: "ss-twinkle 3.4s ease-in-out infinite" }}>✧</Box>

      <Box
        position="absolute"
        left="50%"
        top={{ base: "20px", sm: "30px", md: "44px" }}
        transform="translateX(-50%)"
        w="660px"
        maxW="90%"
        p="8px"
        bg="#FFF3D6"
        border="5px solid #FFE0AF"
        borderRadius="20px"
        boxShadow="0 10px 0 rgba(244,139,180,.35)"
      >
        <Box
          border="3px solid #FFC2DA"
          borderRadius="14px"
          bg="white"
          px={{ base: "12px", md: "26px" }}
          pt={{ base: "8px", md: "14px" }}
          pb={{ base: "10px", md: "18px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={{ base: "10px", md: "22px" }}
        >
          <Image
            src="/Llama1.png"
            alt="Lumi the llama"
            w={{ base: "48px", sm: "64px", md: "92px" }}
            flexShrink={0}
            style={{ imageRendering: "pixelated", animation: "ss-float 5s ease-in-out infinite" }}
            filter="drop-shadow(0 6px 10px rgba(196,87,127,.2))"
          />
          <Box textAlign="center">
            <Text
              fontFamily="'Jersey 25', cursive"
              fontSize={{ base: "28px", sm: "40px", md: "64px" }}
              lineHeight=".95"
              color="#F27DAB"
              letterSpacing="2px"
              textShadow="0 3px 0 #FFE0EC"
            >
              SoftSpace
            </Text>
            <Text fontSize={{ base: "7px", md: "11px" }} fontWeight="700" letterSpacing={{ base: "2px", md: "5px" }} color="#C9A6D9" mt="4px">
              YOUR DIGITAL SANCTUARY
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RoomBanner;
