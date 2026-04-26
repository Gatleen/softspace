import { Box, Text, Image, Button, VStack } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";

const LOGO_SRC = "/Llama1.png";

interface Props {
  onEnter: () => void;
}

const StartPage = ({ onEnter }: Props) => {
  return (
    <Box
      h="100vh" // Falls back to 100vh if dvh isn't supported
      minH="100dvh" // "dvh" handles mobile browser bars better
      w="100vw"
      bg="linear-gradient(to bottom right, #ABA7E3, #A677CA, #4525A2)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
      p={4} // 📱 Adds safety padding for mobile screens
    >
      {/* 🌊 Animation Styles */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      {/* Background overlay */}
      <Box
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        bg="whiteAlpha.50"
        pointerEvents="none"
      />

      {/* Main Content Stack */}
      <VStack
        gap={{ base: 4, md: 6 }} // 📏 Reduced gap (tighter layout)
        zIndex={1}
        textAlign="center"
      >
        {/* Group: Logo + Text (Kept close together) */}
        <VStack gap={2}>
          {" "}
          {/* 👈 Very tight gap between Logo and Text */}
          {/* 🛸 Animated Logo */}
          <Box
            animation="float 4s ease-in-out infinite"
            filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.3))"
            mb={2} // Slight bottom margin to separate from text
          >
            <Image
              src={LOGO_SRC}
              alt="SoftSpace Logo"
              // 📱 Responsive Width: Smaller on mobile (140px), regular on desktop (180px)
              w={{ base: "140px", md: "180px" }}
              h="auto"
            />
          </Box>
          {/* 📝 Title Text */}
          <VStack gap={0}>
            <Text
              // 📱 Responsive Font: Smaller on mobile
              fontSize={{ base: "4xl", md: "6xl" }}
              fontWeight="black"
              color="white"
              letterSpacing="tight"
              lineHeight="1.1"
              textShadow="0px 4px 10px rgba(0,0,0,0.2)"
            >
              SoftSpace
            </Text>
            <Text
              color="whiteAlpha.900"
              fontSize={{ base: "sm", md: "lg" }}
              fontWeight="medium"
              letterSpacing="widest"
              textTransform="uppercase"
              mt={1}
            >
              Your Digital Sanctuary
            </Text>
          </VStack>
        </VStack>

        {/* 🚪 Enter Button */}
        <Button
          size="xl"
          h={{ base: "50px", md: "60px" }} // 📱 Responsive Height
          px={{ base: 8, md: 10 }}
          bg="white"
          color="#4525A2"
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="bold"
          borderRadius="full"
          boxShadow="0px 4px 25px rgba(0,0,0,0.2)"
          _hover={{
            transform: "translateY(-4px)",
            boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
            bg: "gray.50",
          }}
          transition="all 0.3s"
          onClick={onEnter}
          mt={{ base: 6, md: 8 }} // 📏 Adds space before the button so it stands out
        >
          Enter Space <ArrowRight size={20} style={{ marginLeft: "8px" }} />
        </Button>
      </VStack>
    </Box>
  );
};

export default StartPage;
