import { Box, Text, Image } from "@chakra-ui/react";
import companionData from "../data/companions.json";

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

// Same pastel gradient cycle used for the companion picker cards in Companions.tsx —
// kept as a local copy here to avoid a circular import between the two files.
const ACCENT_GRADIENTS = [
  "linear-gradient(150deg,#FFF6FA 0%,#FFD9E8 45%,#E6D9FA 100%)",
  "linear-gradient(150deg,#FFFDF6 0%,#DCEBFB 45%,#F3DDEC 100%)",
  "linear-gradient(150deg,#FBF3FF 0%,#E6D9FA 45%,#CFE6F8 100%)",
  "linear-gradient(150deg,#FFF9F0 0%,#FBE7CF 45%,#F6D8E6 100%)",
  "linear-gradient(150deg,#F4FBFF 0%,#CFE6F8 45%,#E8DCF7 100%)",
  "linear-gradient(150deg,#FFFFFF 0%,#F6E4EF 45%,#DDE7FA 100%)",
];

const WAVEFORM_COLORS = ["#F9A8CB", "#CDB4F6", "#BDE0FE", "#F9A8CB", "#CDB4F6"];
const WAVEFORM_HEIGHTS = [8, 14, 10, 16, 7];

const CharacterProfile = ({ char }: { char: Character }) => {
  const playVoice = () => {
    const audio = new Audio(char.voiceLine);
    audio.play().catch((err) => console.error("Audio play failed:", err));
  };

  const index = companionData.characters.findIndex((c) => c.name === char.name);
  const accentGradient = ACCENT_GRADIENTS[(index >= 0 ? index : 0) % ACCENT_GRADIENTS.length];

  return (
    <Box
      w="full"
      bg="white"
      border="2.5px solid #FFDDEB"
      borderRadius="26px"
      boxShadow="0 6px 0 rgba(255,199,222,.45)"
      overflow="hidden"
    >
      {/* Washi tape strip */}
      <Box
        h="14px"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg,#FFC2DA 0 18px,#FFF3D6 18px 36px)",
        }}
      />

      <Box display="flex" gap="24px" p="26px 30px 30px" alignItems="flex-start">
        {/* Left: portrait + voice line */}
        <Box
          w="180px"
          flexShrink={0}
          p="16px"
          borderRadius="22px"
          background={accentGradient}
          border="3px solid white"
          boxShadow="0 6px 0 rgba(196,87,127,.15)"
          textAlign="center"
        >
          <Image src={char.image} w="full" objectFit="contain" imageRendering="pixelated" />

          <Box
            as="button"
            onClick={playVoice}
            display="flex"
            alignItems="center"
            gap="8px"
            mt="10px"
            p="7px 10px"
            w="full"
            borderRadius="14px"
            background="rgba(255,255,255,.85)"
            boxShadow="0 3px 0 rgba(196,87,127,.12)"
            cursor="pointer"
          >
            <Box
              w="26px"
              h="26px"
              flexShrink={0}
              borderRadius="999px"
              background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="11px"
              lineHeight="1"
            >
              ▶
            </Box>
            <Box textAlign="left" flex="1" minW={0}>
              <Text fontSize="8.5px" fontWeight="800" color="#C0577E" letterSpacing=".5px">
                VOICE LINE
              </Text>
              <Box display="flex" alignItems="flex-end" gap="2px" h="14px" mt="2px">
                {WAVEFORM_HEIGHTS.map((h, i) => (
                  <Box
                    key={i}
                    w="3px"
                    h={`${h}px`}
                    borderRadius="2px"
                    background={WAVEFORM_COLORS[i % WAVEFORM_COLORS.length]}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right: info */}
        <Box flex="1" minW={0}>
          <Text fontFamily="'Jersey 25', cursive" fontSize="42px" color="#C0577E" lineHeight="1.1">
            {char.name}
          </Text>

          <Box display="flex" gap="8px" mt="8px" flexWrap="wrap">
            <Box px="10px" py="5px" borderRadius="999px" background="#FFF0F6" border="2px solid #FFDDEB">
              <Text fontSize="8px" fontWeight="800" color="#C9A6D9" letterSpacing=".5px">
                NICKNAME
              </Text>
              <Text fontSize="12px" fontWeight="700" color="#F27DAB">
                {char.nickname}
              </Text>
            </Box>
            <Box
              px="10px"
              py="5px"
              borderRadius="999px"
              background="#F6F0FF"
              border="2px solid #EEDCFB"
              display="flex"
              alignItems="center"
            >
              <Text fontSize="12px" fontWeight="700" color="#8A6BD1">
                {char.animal}
              </Text>
            </Box>
            <Box
              px="10px"
              py="5px"
              borderRadius="999px"
              background="#F1F8FE"
              border="2px solid #D8E9FB"
              display="flex"
              alignItems="center"
            >
              <Text fontSize="12px" fontWeight="700" color="#5B8FD6">
                {char.role}
              </Text>
            </Box>
          </Box>

          <Box mt="16px" p="14px 18px" borderRadius="16px" background="#FFFBF0" border="2px solid #FBEFCF">
            <Text fontSize="10px" fontWeight="800" letterSpacing="2px" color="#C99A3E">
              FAVOURITE QUOTE
            </Text>
            <Text fontSize="15px" fontWeight="700" fontStyle="italic" color="#5C4A63" mt="4px">
              "{char.favouriteQuote}"
            </Text>
          </Box>

          <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr" }} gap="14px" mt="16px">
            <Box p="14px" borderRadius="16px" background="#FFF9FC" border="2px solid #FFE9F1">
              <Text fontSize="10px" fontWeight="800" color="#F27DAB" letterSpacing="1px" mb="6px">
                LIKES ♡
              </Text>
              {char.likes.map((l) => (
                <Text key={l} fontSize="12.5px" fontWeight="600" color="#5C4A63" mt="2px">
                  <Text as="span" color="#F9A8CB">
                    ♡
                  </Text>{" "}
                  {l}
                </Text>
              ))}
            </Box>
            <Box p="14px" borderRadius="16px" background="#F8F7FC" border="2px solid #EEE7F6">
              <Text fontSize="10px" fontWeight="800" color="#8A6BD1" letterSpacing="1px" mb="6px">
                DISLIKES ✗
              </Text>
              {char.dislikes.map((d) => (
                <Text key={d} fontSize="12.5px" fontWeight="600" color="#5C4A63" mt="2px">
                  <Text as="span" color="#CDB4F6">
                    ✗
                  </Text>{" "}
                  {d}
                </Text>
              ))}
            </Box>
          </Box>

          <Box display="grid" style={{ gridTemplateColumns: "1fr 1fr" }} gap="14px" mt="14px">
            <Box p="14px" borderRadius="16px" background="#F1F8FE" border="2px solid #D8E9FB">
              <Text fontSize="10px" fontWeight="800" color="#5B8FD6" letterSpacing="1px" mb="4px">
                PERSONALITY
              </Text>
              <Text fontSize="12.5px" fontWeight="700" color="#5C4A63">
                {char.personality}
              </Text>
            </Box>
            <Box p="14px" borderRadius="16px" background="#FFF0F6" border="2px solid #FFDDEB">
              <Text fontSize="10px" fontWeight="800" color="#F27DAB" letterSpacing="1px" mb="4px">
                SPECIAL SKILL
              </Text>
              <Text fontSize="12.5px" fontWeight="700" color="#5C4A63">
                {char.specialSkill}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CharacterProfile;
