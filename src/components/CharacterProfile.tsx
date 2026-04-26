import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Separator,
  SimpleGrid,
} from "@chakra-ui/react";

interface Character {
  name: string;
  nickname: string;
  role: string;
  likes: string[];
  dislikes: string[];
  favouriteQuote: string;
  personality: string;
  specialSkill: string;
  accentColor: string;
  animal: string;
  image: string;
  voiceLine: string;
}

const CharacterProfile = ({ char }: { char: Character }) => {
  const playVoice = () => {
    const audio = new Audio(char.voiceLine);
    audio.play().catch((err) => console.error("Audio play failed:", err));
  };

  return (
    <Box
      w="full"
      bg="white"
      border="4px solid #F8BBD0"
      rounded="3xl"
      boxShadow="10px 10px 0px #FCE4EC"
      p={8}
      fontFamily="'VT323', monospace"
      animation="soft-pop 0.3s ease-out"
    >
      {/* Banner Ribbon */}
      <Box
        bg={char.accentColor}
        border="3px solid white"
        outline="3px solid #F8BBD0"
        m="-15px -15px 30px -15px"
        p={3}
        rounded="xl"
        textAlign="center"
      >
        <Text color="white" fontSize="4xl" textShadow="2px 2px #D81B60">
          ✨ {char.nickname}'s Profile ✨
        </Text>
      </Box>

      <HStack
        align="flex-start"
        gap={10}
        flexDir={{ base: "column", md: "row" }}
      >
        {/* Left Column: Image & Minigame */}
        <VStack gap={5} minW="240px">
          <Box
            border="4px solid #F8BBD0"
            p={3}
            bg="white"
            rounded="2xl"
            boxShadow="0 8px 20px rgba(248, 187, 208, 0.4)"
            position="relative"
            className="sparkle-box"
          >
            <Box
              w="220px"
              h="220px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={char.image}
                maxW="100%"
                maxH="100%"
                objectFit="contain"
                imageRendering="pixelated"
              />
            </Box>
          </Box>

        </VStack>

        {/* Right Column: Info Area */}
        <VStack align="stretch" flex={1} gap={4}>
          <Box>
            <Text fontSize="4xl" color="#D81B60" fontWeight="bold">
              {char.name}
            </Text>
            <Text fontSize="2xl" color="pink.400">
              ❀ {char.role} ({char.animal})
            </Text>
          </Box>

          <Separator
            borderColor="#FCE4EC"
            borderBottomWidth="4px"
            rounded="full"
          />

          <VStack align="stretch" gap={2} fontSize="xl" color="gray.600">
            <Text>
              <b>Magic Power:</b> {char.specialSkill}
            </Text>
            <Text>
              <b>Personality:</b> {char.personality}
            </Text>
          </VStack>

          <SimpleGrid columns={2} gap={5} pt={2}>
            <Box
              bg="#E8F5E9"
              p={4}
              border="2px solid #C8E6C9"
              rounded="2xl"
              boxShadow="4px 4px 0px #C8E6C9"
            >
              <Text color="green.600" fontWeight="bold" fontSize="xl">
                🌸 LIKES
              </Text>
              {char.likes.map((l) => (
                <Text key={l}>♡ {l}</Text>
              ))}
            </Box>
            <Box
              bg="#FFF3E0"
              p={4}
              border="2px solid #FFE0B2"
              rounded="2xl"
              boxShadow="4px 4px 0px #FFE0B2"
            >
              <Text color="orange.600" fontWeight="bold" fontSize="xl">
                ☁ DISLIKES
              </Text>
              {char.dislikes.map((d) => (
                <Text key={d}>× {d}</Text>
              ))}
            </Box>
          </SimpleGrid>

          {/* Quote Section with Custom Sound Button */}
          <HStack
            mt={4}
            p={5}
            border="2px dashed #F48FB1"
            bg="#FFF9FA"
            rounded="xl"
            justify="space-between"
            align="center"
          >
            <Text
              fontStyle="italic"
              fontSize="2xl"
              color="#C2185B"
              flex={1}
              pr={6} // Space between text and button
            >
              "{char.favouriteQuote}"
            </Text>

            <Box
              as="button"
              onClick={playVoice}
              bg={char.accentColor}
              w="60px"
              h="60px"
              rounded="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0} // Prevents button from squishing
              border="3px solid white"
              boxShadow="0 4px 0px #F8BBD0"
              transition="0.2s all"
              _hover={{ transform: "scale(1.1)" }}
              _active={{ transform: "scale(0.9)", boxShadow: "none" }}
            >
              <Image
                src="/SoundButton.png"
                alt="Play"
                w="35px"
                h="35px"
                objectFit="contain"
              />
            </Box>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

export default CharacterProfile;
