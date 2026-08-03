import { useEffect, useState } from "react";
import { Box, Text, Image } from "@chakra-ui/react";
import SectionHeader from "./ui/SectionHeader";
import { BADGES, getAchievementState } from "../lib/achievements";

// Cycled per badge index (only applied to unlocked badges — locked ones stay flat/neutral)
const UNLOCKED_TINTS = ["#FFF0F6", "#F6F0FF", "#F1F8FE", "#FFFBF0"];
const ROTATIONS = ["-2.5deg", "1.8deg", "-1.2deg", "2.4deg", "-1.8deg"];
const LOCKED_TINT = "#F6F2F4";

const Achievements = () => {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAchievementState().then((state) => {
      setUnlockedIds(new Set(state.unlocked_badges));
      setLoaded(true);
    });
  }, []);

  const unlockedCount = unlockedIds.size;

  return (
    <Box>
      <SectionHeader
        title="Your Hall of Fame"
        meta={`${unlockedCount} / ${BADGES.length} unlocked · earned ones are downloadable stickers`}
      />

      <Box
        display="flex"
        alignItems="center"
        px="16px"
        py="9px"
        borderRadius="16px"
        background="#FFFBF0"
        border="2px solid #FBEFCF"
        fontSize="11.5px"
        fontWeight="700"
        color="#C99A3E"
        mb="22px"
      >
        Drop your own art onto any earned sticker — it keeps the white die-cut outline
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }}
        gap="22px"
        opacity={loaded ? 1 : 0.5}
      >
        {BADGES.map((badge, i) => {
          const unlocked = unlockedIds.has(badge.id);
          const tint = unlocked ? UNLOCKED_TINTS[i % UNLOCKED_TINTS.length] : LOCKED_TINT;
          const rotation = unlocked ? ROTATIONS[i % ROTATIONS.length] : "0deg";
          const border = unlocked ? "#FFDDEB" : "#EFE7EC";

          return (
            <Box key={badge.id}>
              <Box
                p="9px"
                borderRadius="28px"
                background="white"
                style={{ transform: `rotate(${rotation})` }}
                boxShadow={`0 0 0 2.5px ${border},0 8px 0 rgba(255,199,222,.4),0 14px 24px rgba(196,87,127,.1)`}
                opacity={unlocked ? 1 : 0.62}
              >
                <Box borderRadius="21px" background={tint} px="14px" pt="16px" pb="12px" textAlign="center">
                  {unlocked ? (
                    <Box
                      w="86px"
                      h="86px"
                      mx="auto"
                      borderRadius="999px"
                      bg="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 0 0 4px #fff,0 0 0 6px rgba(255,255,255,.9),0 4px 10px rgba(196,87,127,.15)"
                    >
                      <Text fontSize="40px" lineHeight="1">
                        {badge.icon}
                      </Text>
                    </Box>
                  ) : (
                    <Box
                      w="86px"
                      h="86px"
                      mx="auto"
                      borderRadius="999px"
                      bg="#EFE9EC"
                      border="3px solid white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      style={{ filter: "grayscale(1)" }}
                    >
                      <Text fontSize="34px" lineHeight="1">
                        🔒
                      </Text>
                    </Box>
                  )}

                  <Text
                    fontFamily="'Jersey 25', cursive"
                    fontSize="24px"
                    color={unlocked ? "#C0577E" : "#C2B4BD"}
                    mt="10px"
                  >
                    {badge.name}
                  </Text>

                  <Text
                    fontSize="11.5px"
                    fontWeight="600"
                    color={unlocked ? "#A08B9B" : "#C7BCC4"}
                    mt="3px"
                    minH="32px"
                  >
                    {badge.desc}
                  </Text>

                  <Box
                    mt="10px"
                    pt="8px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap="6px"
                    style={{ borderTop: "2px dotted rgba(255,255,255,.9)" }}
                  >
                    <Image src="/Llama1.png" alt="" boxSize="18px" objectFit="contain" />
                    <Text fontFamily="'Jersey 25', cursive" fontSize="16px" color="#C9A6D9">
                      SoftSpace
                    </Text>
                  </Box>
                </Box>
              </Box>

              {unlocked ? (
                <Box
                  as="button"
                  mt="10px"
                  w="full"
                  py="8px"
                  borderRadius="999px"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                  border="2px solid white"
                  boxShadow="0 4px 0 rgba(196,87,127,.2)"
                  fontFamily="'Jersey 25', cursive"
                  fontSize="14px"
                  color="white"
                  textAlign="center"
                  cursor="pointer"
                  style={{ textShadow: "0 2px 0 rgba(196,87,127,.3)" }}
                >
                  ⤓ Download sticker
                </Box>
              ) : (
                <Box
                  mt="10px"
                  w="full"
                  py="8px"
                  borderRadius="999px"
                  background="#F4F1F3"
                  textAlign="center"
                  fontSize="12px"
                  fontWeight="700"
                  color="#B7A9B1"
                >
                  locked
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Achievements;
