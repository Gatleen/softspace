import { Box, Text, Image } from "@chakra-ui/react";

interface Props {
  currentTime: Date;
  setFocusMode: (val: boolean) => void;
}

const Header = ({ currentTime, setFocusMode }: Props) => {
  const username = "Gatleen";
  const dailyQuote = "Small steps every day add up to big results.";
  const isAM = currentTime.getHours() < 12;

  const icons = {
    sparkle: "/icons/Sparkle.png",
    quote: "/icons/Quotes.png",
    brain: "/icons/Brain.png",
  };

  return (
    <Box
      flex="1"
      bg="white"
      border="2.5px solid #FFDDEB"
      borderRadius="24px"
      p={{ base: "16px 18px", md: "22px 26px" }}
      boxShadow="0 6px 0 rgba(255,199,222,.45)"
      position="relative"
      overflow="hidden"
    >
      <Box display="flex" flexDirection={{ base: "column", md: "row" }} alignItems="flex-start" justifyContent="space-between" gap={{ base: "12px", md: "16px" }}>
        <Box>
          <Box display="flex" alignItems="center" gap={{ base: "8px", md: "10px" }}>
            <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "26px", md: "38px" }} lineHeight="1.05" color="#4A3B52">
              How's it going, <Text as="span" color="#F27DAB">{username}</Text>?
            </Text>
            <Image src={icons.sparkle} alt="" boxSize={{ base: "22px", md: "30px" }} objectFit="contain" />
          </Box>
          <Text fontSize="13px" fontWeight="600" color="#A08B9B" mt="2px">
            Ready to make today amazing?
          </Text>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap="10px"
          px={{ base: "12px", md: "16px" }}
          py={{ base: "8px", md: "10px" }}
          borderRadius="18px"
          background="linear-gradient(150deg,#EFE6FC,#DCEAFB)"
          border="3px solid white"
          boxShadow="0 4px 0 rgba(205,180,246,.45), inset 0 2px 8px rgba(122,90,160,.12)"
          flexShrink={0}
        >
          <Text
            fontFamily="'Jersey 25', cursive"
            fontSize={{ base: "30px", md: "44px" }}
            lineHeight=".85"
            color="#7A5AA6"
            letterSpacing="3px"
            textShadow="0 2px 0 white"
          >
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
          </Text>
          <Box display="flex" flexDirection="column" gap="3px" pt="3px">
            <Text px="6px" borderRadius="6px" bg={isAM ? "#7A5AA6" : "transparent"} fontSize="10px" fontWeight="800" letterSpacing="1px" color={isAM ? "white" : "#B4A2CE"}>
              AM
            </Text>
            <Text px="6px" borderRadius="6px" bg={!isAM ? "#7A5AA6" : "transparent"} fontSize="10px" fontWeight="800" letterSpacing="1px" color={!isAM ? "white" : "#B4A2CE"}>
              PM
            </Text>
          </Box>
        </Box>
      </Box>

      <Box
        display="flex"
        alignItems="center"
        gap={{ base: "10px", md: "14px" }}
        mt={{ base: "14px", md: "18px" }}
        px={{ base: "12px", md: "16px" }}
        py={{ base: "10px", md: "14px" }}
        borderRadius="18px"
        background="linear-gradient(135deg,#FDF2F8,#F4EEFF)"
        border="2px solid #EEDCFB"
      >
        <Box
          w={{ base: "36px", md: "44px" }}
          h={{ base: "36px", md: "44px" }}
          borderRadius="999px"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          boxShadow="0 3px 0 rgba(205,180,246,.4)"
        >
          <Image src={icons.quote} alt="" boxSize={{ base: "18px", md: "22px" }} objectFit="contain" />
        </Box>
        <Box>
          <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#8A6BD1">
            DAILY QUOTE
          </Text>
          <Text fontSize={{ base: "13px", md: "14.5px" }} fontStyle="italic" fontWeight="600" color="#5C4A63" mt="2px">
            "{dailyQuote}"
          </Text>
        </Box>
      </Box>

      <Box
        onClick={() => setFocusMode(true)}
        display="inline-flex"
        alignItems="center"
        gap="9px"
        mt={{ base: "12px", md: "16px" }}
        px={{ base: "16px", md: "20px" }}
        py={{ base: "9px", md: "11px" }}
        borderRadius="999px"
        background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
        border="2.5px solid white"
        cursor="pointer"
        boxShadow="0 5px 0 rgba(196,87,127,.22)"
        transition="transform 0.15s ease"
        _hover={{ transform: "translateY(-2px)" }}
      >
        <Image src={icons.brain} alt="" boxSize={{ base: "18px", md: "20px" }} objectFit="contain" />
        <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "19px", md: "22px" }} color="white" letterSpacing=".5px" textShadow="0 2px 0 rgba(196,87,127,.3)">
          Enter Focus Mode
        </Text>
      </Box>
    </Box>
  );
};

export default Header;
