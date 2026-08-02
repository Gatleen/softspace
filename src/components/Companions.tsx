import { useState } from "react";
import { Box, SimpleGrid, Text, Image } from "@chakra-ui/react";
import CharacterProfile from "./CharacterProfile";
import companionData from "../data/companions.json";
import SectionHeader from "./ui/SectionHeader";

// Soft pastel gradients cycled across the companion picker cards.
// Shared (by index) with CharacterProfile's accent-gradient panel.
export const COMPANION_GRADIENTS = [
  "linear-gradient(150deg,#FFF6FA 0%,#FFD9E8 45%,#E6D9FA 100%)",
  "linear-gradient(150deg,#FFFDF6 0%,#DCEBFB 45%,#F3DDEC 100%)",
  "linear-gradient(150deg,#FBF3FF 0%,#E6D9FA 45%,#CFE6F8 100%)",
  "linear-gradient(150deg,#FFF9F0 0%,#FBE7CF 45%,#F6D8E6 100%)",
  "linear-gradient(150deg,#F4FBFF 0%,#CFE6F8 45%,#E8DCF7 100%)",
  "linear-gradient(150deg,#FFFFFF 0%,#F6E4EF 45%,#DDE7FA 100%)",
];

const Companions = () => {
  const [selected, setSelected] = useState(companionData.characters[0]);

  return (
    <Box>
      <SectionHeader title="SoftSpace Sanctuary" meta="Click a friend to see their diary page" />

      <Box display="flex" gap="22px" alignItems="flex-start">
        {/* Sticker Selection Sidebar */}
        <Box
          w="400px"
          flexShrink={0}
          bg="white"
          border="3px solid #FFC8DE"
          borderRadius="26px"
          p="20px"
          boxShadow="inset 0 0 26px rgba(255,199,222,.35)"
        >
          <Text
            fontFamily="'Jersey 25', cursive"
            fontSize="28px"
            color="#C0577E"
            textAlign="center"
            letterSpacing="1px"
            mb="16px"
          >
            MY BESTIES
          </Text>

          <Box
            maxHeight="500px"
            overflowY="auto"
            pr="6px"
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                background: "#FFC8DE",
                borderRadius: "10px",
              },
            }}
          >
            <SimpleGrid columns={3} gap="12px">
              {companionData.characters.map((char, i) => {
                const isSelected = selected.name === char.name;
                return (
                  <Box
                    key={char.name}
                    as="button"
                    onClick={() => setSelected(char)}
                    p="8px"
                    borderRadius="18px"
                    background={COMPANION_GRADIENTS[i % COMPANION_GRADIENTS.length]}
                    border="3px solid"
                    borderColor={isSelected ? "#F27DAB" : "white"}
                    cursor="pointer"
                    textAlign="center"
                  >
                    <Image src={char.image} w="full" h="78px" objectFit="contain" imageRendering="pixelated" />
                    <Text
                      fontSize="9.5px"
                      fontWeight="800"
                      color="#A08B9B"
                      mt="4px"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {char.nickname}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>

        {/* Diary Page Panel */}
        <Box flex="1" minW={0}>
          <CharacterProfile char={selected} />
        </Box>
      </Box>
    </Box>
  );
};

export default Companions;
