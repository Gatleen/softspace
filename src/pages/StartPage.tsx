import { Box, Text, Image, Button, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";

const LOGO_SRC = "/Llama1.png";
const JERSEY = "'Jersey 25', cursive";

interface Props {
  onEnter: () => void;
}

const StartPage = ({ onEnter }: Props) => {
  return (
    <Box
      h="100vh" // Falls back to 100vh if dvh isn't supported
      minH="100dvh" // "dvh" handles mobile browser bars better
      w="100vw"
      background="linear-gradient(160deg,#E7DEFB 0%,#F6E3F1 45%,#FFF1F7 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
      p={4} // 📱 Adds safety padding for mobile screens
    >
      {/* Decorative blobs */}
      <Box
        position="absolute"
        top="-140px"
        left="-120px"
        w="380px"
        h="380px"
        borderRadius="999px"
        bg="whiteAlpha.600"
        opacity={0.5}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-160px"
        right="-130px"
        w="340px"
        h="340px"
        borderRadius="999px"
        bg="whiteAlpha.600"
        opacity={0.45}
        pointerEvents="none"
      />

      {/* Twinkle stars */}
      <Box
        position="absolute"
        top="14%"
        left="12%"
        fontSize="28px"
        color="#F9A8CB"
        style={{ animation: "ss-twinkle 3s ease-in-out infinite" }}
        pointerEvents="none"
      >
        ✧
      </Box>
      <Box
        position="absolute"
        top="72%"
        right="14%"
        fontSize="22px"
        color="#CDB4F6"
        style={{ animation: "ss-twinkle 2.4s ease-in-out infinite .6s" }}
        pointerEvents="none"
      >
        ✧
      </Box>
      <Box
        position="absolute"
        top="24%"
        right="20%"
        fontSize="16px"
        color="#BDE0FE"
        style={{ animation: "ss-twinkle 2.8s ease-in-out infinite 1.1s" }}
        pointerEvents="none"
      >
        ✧
      </Box>

      {/* Main Content Stack */}
      <VStack gap="28px" zIndex={1} textAlign="center">
        {/* 🛸 Animated Logo */}
        <Box
          style={{ animation: "ss-float 4s ease-in-out infinite" }}
          filter="drop-shadow(0 14px 22px rgba(122,90,160,.3))"
        >
          <Image
            src={LOGO_SRC}
            alt="SoftSpace Logo"
            w={{ base: "140px", md: "190px" }}
            h="auto"
          />
        </Box>

        {/* 🪧 Wooden signboard logo */}
        <Box
          p="10px"
          background="#FFF3D6"
          border="5px solid #FFE0AF"
          borderRadius="24px"
          boxShadow="0 10px 0 rgba(196,87,127,.2)"
        >
          <VStack
            gap="8px"
            border="3px solid #FFC2DA"
            borderRadius="17px"
            background="white"
            px={{ base: "18px", md: "24px" }}
            py={{ base: "14px", md: "20px" }}
          >
            <Text
              fontFamily={JERSEY}
              fontSize={{ base: "48px", md: "84px" }}
              lineHeight="1"
              color="#F27DAB"
              textShadow="0 4px 0 #FFE0EC"
            >
              SoftSpace
            </Text>
            <Text
              fontSize={{ base: "10px", md: "12px" }}
              fontWeight="800"
              letterSpacing="7px"
              color="#C9A6D9"
            >
              YOUR DIGITAL SANCTUARY
            </Text>
          </VStack>
        </Box>

        {/* 🚪 Enter Button */}
        <Button
          variant="plain"
          h="auto"
          px={{ base: "28px", md: "42px" }}
          py={{ base: "12px", md: "15px" }}
          background="white"
          border="3px solid #FFC8DE"
          borderRadius="999px"
          boxShadow="0 8px 0 rgba(196,87,127,.22)"
          fontFamily={JERSEY}
          fontSize={{ base: "24px", md: "32px" }}
          color="#C0577E"
          _hover={{
            transform: "translateY(-4px)",
            boxShadow: "0 12px 0 rgba(196,87,127,.28)",
          }}
          transition="all 0.2s"
          onClick={onEnter}
        >
          Enter Space <ArrowRight size={20} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Box>
  );
};

export default StartPage;
