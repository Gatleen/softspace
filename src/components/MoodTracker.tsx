import { useState } from "react";
import { Box, Image, Text, Textarea } from "@chakra-ui/react";
import SectionHeader from "./ui/SectionHeader";
import SoftSpaceCard from "./ui/SoftSpaceCard";

interface Mood {
  id: number;
  name: string;
  color: string;
  image: string;
  desc: string;
  advice: string;
}

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<
    { mood: Mood; note: string; fullTime: string }[]
  >([]);

  const moods: Mood[] = [
    {
      id: 1,
      name: "Adored",
      color: "#FFC8DD",
      image: "/moods/Adored.png",
      desc: "Feeling loved and cherished!",
      advice: "Share that love! Send a sweet text to someone you care about.",
    },
    {
      id: 2,
      name: "Angry",
      color: "#FF006E",
      image: "/moods/Angry.png",
      desc: "Keep calm and slay on.",
      advice:
        "Write it all down on paper, then rip it up! It's very therapeutic.",
    },
    {
      id: 3,
      name: "Chill",
      color: "#BDE0FE",
      image: "/moods/Chill.png",
      desc: "Just vibing in the soft zone.",
      advice: "Perfect time for a face mask or a cozy book.",
    },
    {
      id: 4,
      name: "Crying",
      color: "#A2D2FF",
      image: "/moods/Crying.png",
      desc: "It's okay to let it out, bestie.",
      advice: "Hydrate! Crying takes energy. Drink some cool water and rest.",
    },
    {
      id: 5,
      name: "Disappointed",
      color: "#FFAFCC",
      image: "/moods/Disappointed.png",
      desc: "Tomorrow is a fresh start.",
      advice:
        "List 3 tiny things that went right today, even if it's just a good snack.",
    },
    {
      id: 6,
      name: "Disgusted",
      color: "#FB5607",
      image: "/moods/Disgusted.png",
      desc: "That's a major ick.",
      advice: "Change your scenery. A quick walk can help reset your senses.",
    },
    {
      id: 7,
      name: "Embarrassed",
      color: "#CDB4DB",
      image: "/moods/Embarrassed.png",
      desc: "Blushing a little too hard!",
      advice:
        "In 5 years, this will be a funny story. Laugh at it now if you can!",
    },
    {
      id: 8,
      name: "Furious",
      color: "#FFBE0B",
      image: "/moods/Furious.png",
      desc: "Channel that fire into power.",
      advice: "Do 20 jumping jacks or a quick dance to shake the energy out.",
    },
    {
      id: 9,
      name: "Happy",
      color: "#CCD5AE",
      image: "/moods/Happy.png",
      desc: "Radiating pure sunshine vibes.",
      advice: "Take a 'mental snapshot' of this feeling to remember later!",
    },
    {
      id: 10,
      name: "Humorous",
      color: "#E9C46A",
      image: "/moods/Humorous.png",
      desc: "Everything is funny today!",
      advice: "Share a meme! Spread the giggles to the group chat.",
    },
    {
      id: 11,
      name: "Hungry",
      color: "#FF0054",
      image: "/moods/Hungry.png",
      desc: "Time for a sweet treat?",
      advice: "Nourish yourself with something colorful and delicious.",
    },
    {
      id: 12,
      name: "Kissy",
      color: "#8338EC",
      image: "/moods/Kissy.png",
      desc: "Sending love your way!",
      advice: "Go give a pet or a loved one a big hug.",
    },
    {
      id: 13,
      name: "Love",
      color: "#FFD60A",
      image: "/moods/Love.png",
      desc: "Heart is full of sparkles.",
      advice: "Journal about what you love most right now.",
    },
    {
      id: 14,
      name: "Melting",
      color: "#C9184A",
      image: "/moods/Melting.png",
      desc: "Too cute to function.",
      advice: "Look at more cute animal videos. Lean into the cuteness!",
    },
    {
      id: 15,
      name: "Nervous",
      color: "#CAF0F8",
      image: "/moods/Nervous.png",
      desc: "Take a deep breath.",
      advice: "Try the 4-7-8 breathing technique. You've got this!",
    },
    {
      id: 16,
      name: "Neutral",
      color: "#FFB5A7",
      image: "/moods/Neutral.png",
      desc: "Balanced and steady.",
      advice: "A great time for some light cleaning or organizing.",
    },
    {
      id: 17,
      name: "Rage",
      color: "#3C096C",
      image: "/moods/Rage.png",
      desc: "Releasing the inner storm.",
      advice: "Scream into a pillow! It sounds silly, but it works.",
    },
    {
      id: 18,
      name: "Sad",
      color: "#2D6A4F",
      image: "/moods/Sad.png",
      desc: "A soft day for quiet thoughts.",
      advice: "Put on your favorite comfort movie and get under a blanket.",
    },
    {
      id: 19,
      name: "Shocked",
      color: "#90E0EF",
      image: "/moods/Shocked.png",
      desc: "Wait, what just happened?!",
      advice: "Take a minute to process before reacting. Stay grounded.",
    },
    {
      id: 20,
      name: "Smiley",
      color: "#540B0E",
      image: "/moods/Smiley.png",
      desc: "Grinning from ear to ear.",
      advice: "Your smile is contagious! Keep shining.",
    },
    {
      id: 21,
      name: "Sobbing",
      color: "#FF70A6",
      image: "/moods/Sobbing.png",
      desc: "Deep feels emotional hour.",
      advice:
        "Wash your face with cool water. It helps reset your nervous system.",
    },
    {
      id: 22,
      name: "Suspicious",
      color: "#7400B8",
      image: "/moods/Suspicious.png",
      desc: "Something's not adding up...",
      advice: "Trust your gut, but look for facts before deciding.",
    },
    {
      id: 23,
      name: "Scared",
      color: "#E2E8F0",
      image: "/moods/Scared.png",
      desc: "Holding on tight!",
      advice: "Turn on some lights and play upbeat music to shift the vibe.",
    },
    {
      id: 24,
      name: "Teary",
      color: "#D00000",
      image: "/moods/Teary.png",
      desc: "Happy tears or sad ones?",
      advice: "Let them flow. Tears are just the heart's way of speaking.",
    },
    {
      id: 25,
      name: "Very Shocked",
      color: "#FF99C8",
      image: "/moods/VeryShocked.png",
      desc: "Mind = Blown. ✨",
      advice:
        "Deep breaths. Take a moment to sit down and let the news settle.",
    },
  ];

  const logMood = () => {
    if (!selectedMood) return;
    const now = new Date();
    const entry = {
      mood: selectedMood,
      note: note || "No thoughts logged.",
      fullTime: `${now.toLocaleDateString()} @ ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };
    setHistory([entry, ...history].slice(0, 10));
    setNote("");
    setSelectedMood(null);
  };

  return (
    <Box>
      <SectionHeader title="How are you feeling?" />

      <Box
        display="flex"
        flexDirection={{ base: "column", lg: "row" }}
        gap="22px"
        alignItems={{ base: "stretch", lg: "flex-start" }}
      >
        {/* 🧩 Mood Picker Grid */}
        <Box flex="1">
          <SoftSpaceCard
            title="Pick your mood"
            subtitle="25 little faces to choose from"
          >
            <Box
              display="grid"
              gridTemplateColumns={{ base: "repeat(4,1fr)", sm: "repeat(5,1fr)" }}
              gap="10px"
            >
              {moods.map((mood) => {
                const selected = selectedMood?.id === mood.id;
                return (
                  <Box
                    key={mood.id}
                    onClick={() => setSelectedMood(mood)}
                    p="10px 6px"
                    borderRadius="16px"
                    background={
                      selected
                        ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                        : "#FFF9FC"
                    }
                    border="2.5px solid"
                    borderColor={selected ? "white" : "#FFE9F1"}
                    cursor="pointer"
                    textAlign="center"
                    transition="transform 0.15s"
                    _hover={{ transform: "translateY(-2px)" }}
                  >
                    <Image
                      src={mood.image}
                      alt={mood.name}
                      boxSize="46px"
                      mx="auto"
                      objectFit="contain"
                    />
                    <Text
                      fontSize="10px"
                      fontWeight="800"
                      color={selected ? "white" : "#A08B9B"}
                      mt="4px"
                    >
                      {mood.name}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          </SoftSpaceCard>
        </Box>

        {/* 💌 Logging & Advice Column */}
        <Box
          w={{ base: "100%", lg: "400px" }}
          flexShrink={0}
          display="flex"
          flexDirection="column"
          gap="18px"
        >
          {/* Selected-mood detail card */}
          <Box
            bg="white"
            border="2.5px solid #FFDDEB"
            borderRadius="24px"
            boxShadow="0 6px 0 rgba(255,199,222,.45)"
            p="24px"
            textAlign="center"
          >
            {selectedMood ? (
              <>
                <Image
                  src={selectedMood.image}
                  alt={selectedMood.name}
                  boxSize="104px"
                  mx="auto"
                  objectFit="contain"
                />
                <Text
                  fontFamily="'Jersey 25', cursive"
                  fontSize="38px"
                  color="#C0577E"
                  lineHeight="1.1"
                  mt="6px"
                >
                  {selectedMood.name}
                </Text>
                <Text fontSize="13.5px" fontWeight="700" color="#8A7690">
                  {selectedMood.desc}
                </Text>

                <Box
                  mt="16px"
                  p="14px 16px"
                  borderRadius="16px"
                  background="linear-gradient(135deg,#FDF2F8,#F4EEFF)"
                  border="2px solid #EEDCFB"
                  textAlign="left"
                >
                  <Text
                    fontSize="10px"
                    fontWeight="800"
                    letterSpacing="2px"
                    color="#8A6BD1"
                  >
                    TINY ADVICE
                  </Text>
                  <Text fontSize="13px" fontWeight="600" color="#5C4A63" mt="4px">
                    {selectedMood.advice}
                  </Text>
                </Box>

                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything you want to remember about today?"
                  mt="14px"
                  p="12px 14px"
                  borderRadius="16px"
                  border="2px dashed #FFC8DE"
                  textAlign="left"
                  minH="56px"
                  fontSize="13px"
                  color="#5C4A63"
                  _placeholder={{ color: "#C2AECF" }}
                  _focus={{ borderColor: "#F27DAB" }}
                />

                <Box
                  as="button"
                  onClick={logMood}
                  mt="14px"
                  w="100%"
                  py="12px"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                  border="2.5px solid white"
                  borderRadius="999px"
                  boxShadow="0 5px 0 rgba(196,87,127,.22)"
                  cursor="pointer"
                >
                  <Text
                    fontFamily="'Jersey 25', cursive"
                    fontSize="20px"
                    color="white"
                    textShadow="0 2px 0 rgba(196,87,127,.3)"
                    letterSpacing=".5px"
                  >
                    Log this mood ♡
                  </Text>
                </Box>
              </>
            ) : (
              <Text
                color="#A08B9B"
                fontWeight="700"
                fontSize="14px"
                py="40px"
              >
                Pick a mood to start
                <br />
                reflecting!
              </Text>
            )}
          </Box>

          {/* Recent check-ins */}
          <Box
            bg="white"
            border="2.5px solid #EEDCFB"
            borderRadius="24px"
            boxShadow="0 6px 0 rgba(205,180,246,.35)"
            p="18px 20px"
          >
            <Text
              fontSize="10.5px"
              fontWeight="800"
              letterSpacing="2px"
              color="#8A6BD1"
              mb="12px"
            >
              RECENT CHECK-INS
            </Text>

            {history.length > 0 ? (
              <Box display="flex" flexDirection="column" gap="8px">
                {history.map((h, i) => (
                  <Box
                    key={i}
                    display="flex"
                    alignItems="center"
                    gap="11px"
                    p="10px 12px"
                    borderRadius="14px"
                    background="#FFF9FC"
                    border="2px solid #FFE9F1"
                  >
                    <Image
                      src={h.mood.image}
                      alt={h.mood.name}
                      boxSize="34px"
                      objectFit="contain"
                      flexShrink={0}
                    />
                    <Box flex="1" minW={0}>
                      <Text fontSize="12.5px" fontWeight="800" color="#C0577E">
                        {h.mood.name}
                      </Text>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color="#A08B9B"
                        style={{ wordBreak: "break-word" }}
                      >
                        {h.note}
                      </Text>
                    </Box>
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      color="#C2AECF"
                      flexShrink={0}
                      whiteSpace="nowrap"
                    >
                      {h.fullTime}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : (
              <Text textAlign="center" fontSize="12px" color="#C2AECF">
                No entries today ✨
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MoodTracker;
