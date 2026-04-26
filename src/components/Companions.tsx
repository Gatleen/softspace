import React, { useState } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Container,
  Heading,
  Image,
  Center,
  VStack,
} from "@chakra-ui/react";
import CharacterProfile from "./CharacterProfile";
import companionData from "../data/companions.json";

const Companions = () => {
  const [selected, setSelected] = useState(companionData.characters[0]);

  return (
    <Box bg="#FDF6F8" minH="100vh" py={12} fontFamily="'VT323', monospace">
      <Container maxW="1200px">
        <Center mb={12}>
          <VStack gap={3}>
            <Box
              bg="white"
              border="4px solid #F8BBD0"
              px={12}
              py={3}
              rounded="full"
              boxShadow="8px 8px 0px #FCE4EC"
            >
              <Heading size="2xl" color="#D81B60">
                ☁ SoftSpace Sanctuary ☁
              </Heading>
            </Box>
            <Text fontSize="2xl" color="pink.400">
              Click a friend to see their diary page!
            </Text>
          </VStack>
        </Center>

        <SimpleGrid columns={{ base: 1, lg: 12 }} gap={10}>
          {/* Sticker Selection Grid */}
          <Box gridColumn={{ lg: "span 4" }}>
            <Box
              bg="white"
              p={6}
              border="4px solid #F8BBD0"
              rounded="3xl"
              boxShadow="inset 0 0 20px #FCE4EC"
            >
              <Text
                color="#D81B60"
                mb={6}
                textAlign="center"
                fontSize="2xl"
                fontWeight="bold"
              >
                MY BESTIES
              </Text>

              <Box
                maxHeight="500px"
                overflowY="auto"
                pr={2}
                css={{
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#F8BBD0",
                    borderRadius: "10px",
                  },
                }}
              >
                <SimpleGrid columns={3} gap={4}>
                  {companionData.characters.map((char) => (
                    <Box
                      key={char.name}
                      as="button"
                      onClick={() => setSelected(char)}
                      border="3px solid"
                      borderColor={
                        selected.name === char.name ? "#D81B60" : "transparent"
                      }
                      bg={selected.name === char.name ? "#FCE4EC" : "white"}
                      p={2}
                      rounded="2xl"
                      transition="0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                      _hover={{
                        transform: "translateY(-8px) rotate(-5deg) scale(1.1)",
                        boxShadow: "xl",
                        borderColor: "#F48FB1",
                      }}
                      className="sticker-btn"
                    >
                      <Image
                        src={char.image}
                        imageRendering="pixelated"
                        //fallbackSrc="https://via.placeholder.com/100"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          </Box>

          {/* Diary Page Column */}
          <Box gridColumn={{ lg: "span 8" }}>
            <CharacterProfile char={selected} />
          </Box>
        </SimpleGrid>
      </Container>

      {/* Custom Keyframe Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        @keyframes soft-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .sparkle-box::after {
          content: '✨';
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 24px;
          animation: sparkle 1.5s infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
      `,
        }}
      />
    </Box>
  );
};

export default Companions;
