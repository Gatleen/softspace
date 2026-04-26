import { Box, Button, Text, HStack, VStack, Image } from "@chakra-ui/react";

interface Props {
  currentTime: Date;
  setFocusMode: (val: boolean) => void;
}

const Header = ({ currentTime, setFocusMode }: Props) => {
  const username = "Gatleen";
  const dailyQuote = "Small steps every day add up to big results.";

  // 📂 Define your image paths here
  const icons = {
    sparkle: "/icons/Sparkle.png", // Your handwave image
    quote: "/icons/Quotes.png", // Your sparkle image
    brain: "/icons/Brain.png", // Your focus mode moon
  };

  return (
    <Box bg="whiteAlpha.800" p={6} borderRadius="2xl" mb={6} boxShadow="sm">
      <VStack align="stretch" gap={5}>
        {/* Top Row: Greeting & Time */}
        <HStack justify="space-between" align="start">
          <Box>
            <HStack gap={2} align="center">
              <Text
                fontSize="3xl"
                fontWeight="black"
                color="gray.800"
                lineHeight="1.2"
              >
                How's it going,{" "}
                <Text as="span" color="purple.500">
                  {username}
                </Text>
                ?
              </Text>
              {/* ✨ Increased size and added objectFit to prevent cutting */}
              <Image
                src={icons.sparkle}
                alt="sparkle"
                boxSize="32px"
                objectFit="contain"
              />
            </HStack>
            <Text color="gray.500" fontSize="sm" mt={1}>
              Ready to make today amazing?
            </Text>
          </Box>

          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="gray.700"
            fontFamily="monospace"
          >
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </HStack>

        {/* 🌟 Mini Banner: Daily Quote */}
        <Box
          bgGradient="linear(to-r, purple.50, pink.50)"
          p={4}
          borderRadius="xl"
          border="1px solid"
          borderColor="purple.100"
          display="flex"
          alignItems="center"
          gap={4}
        >
          <Box
            bg="white"
            p={2}
            borderRadius="full"
            boxShadow="sm"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="40px"
            minH="40px"
          >
            {/* 📑 Resized quote and ensured it stays contained */}
            <Image
              src={icons.quote}
              alt="quote"
              boxSize="24px"
              objectFit="contain"
            />
          </Box>

          <Box>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="purple.600"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Daily Quote
            </Text>
            <Text
              fontSize="sm"
              color="gray.700"
              fontWeight="medium"
              fontStyle="italic"
            >
              "{dailyQuote}"
            </Text>
          </Box>
        </Box>

        {/* Focus Mode Button */}
        <Box>
          <Button
            colorPalette="purple"
            onClick={() => setFocusMode(true)}
            variant="surface"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Image
              src={icons.brain}
              alt="brain"
              boxSize="20px"
              objectFit="contain"
            />
            Enter Focus Mode
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default Header;
