import React, { useState, useEffect } from "react";
import { Box, Image, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
  Heart,
  Brain,
  Dice5,
  Coffee,
  Gift,
  Smile,
  BookOpen,
  Edit3,
} from "lucide-react";
import SoftSpaceCard from "./ui/SoftSpaceCard";
import SectionHeader from "./ui/SectionHeader";

// ─── SHARED PILL / BADGE HELPERS ─────────────────────────────────────────────
// Small styling helpers reused across all four games so every game's footer
// controls and stat readouts belong to the same visual family.

const PillButton = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <Box
    as="button"
    onClick={disabled ? undefined : onClick}
    px="22px"
    py="10px"
    borderRadius="999px"
    border="2.5px solid white"
    background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
    boxShadow="0 5px 0 rgba(196,87,127,.22)"
    color="white"
    fontFamily="'Jersey 25', cursive"
    fontSize="16px"
    letterSpacing=".4px"
    cursor={disabled ? "default" : "pointer"}
    opacity={disabled ? 0.55 : 1}
    transition="transform .1s, box-shadow .1s"
    _active={
      disabled
        ? {}
        : { transform: "translateY(3px)", boxShadow: "0 2px 0 rgba(196,87,127,.22)" }
    }
  >
    {children}
  </Box>
);

const SecondaryPillButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => (
  <Box
    as="button"
    onClick={onClick}
    px="20px"
    py="9px"
    borderRadius="999px"
    background="#FFF0F6"
    border="2px solid #FFDDEB"
    color="#F27DAB"
    fontFamily="'Jersey 25', cursive"
    fontSize="16px"
    cursor="pointer"
    transition="transform .1s"
    _active={{ transform: "translateY(2px)" }}
  >
    {children}
  </Box>
);

/** Small "badge" style readout (e.g. "Moves: 4") rendered at the top of a game's body. */
const StatPill = ({ children }: { children: ReactNode }) => (
  <Box
    px="12px"
    py="5px"
    borderRadius="999px"
    bg="#FFF0F6"
    border="1.5px solid #FFDDEB"
    fontSize="11px"
    fontWeight="800"
    color="#C0577E"
    whiteSpace="nowrap"
  >
    {children}
  </Box>
);

/** Footer row: primary action(s) on the left, "Back to Arcade" on the right. */
const GameFooter = ({
  children,
  onBack,
}: {
  children?: ReactNode;
  onBack?: () => void;
}) => (
  <Box
    display="flex"
    flexWrap="wrap"
    gap="10px"
    justifyContent="center"
    alignItems="center"
    mt="16px"
    pt="14px"
    borderTop="2px dashed #FFE4EF"
  >
    {children}
    {onBack && <SecondaryPillButton onClick={onBack}>Back to Arcade</SecondaryPillButton>}
  </Box>
);

interface GameProps {
  onBack?: () => void;
}

// ─── MEMORY MATCH ────────────────────────────────────────────────────────────
// 🎨 CUSTOMIZE: Swap these with your own sticker images or emoji!
const EMOJI_SET = ["🌸", "🍵", "🎀", "🌙", "⭐", "🦋", "🍓", "🌈"];

interface MemCard {
  id: number;
  emoji: string;
}

const MemoryMatch = ({ onBack }: GameProps) => {
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const init = () => {
    const deck: MemCard[] = [...EMOJI_SET, ...EMOJI_SET]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
  };

  useEffect(() => {
    init();
  }, []);

  const flip = (idx: number) => {
    if (locked || flipped.includes(idx) || matched.has(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        setMatched((prev) => new Set([...prev, a, b]));
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const won = matched.size === 16;

  return (
    <Box display="flex" flexDirection="column" gap="14px" w="full">
      <Box display="flex" gap="8px" flexWrap="wrap">
        <StatPill>Moves: {moves}</StatPill>
        <StatPill>Matched: {matched.size / 2} / 8</StatPill>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap="12px" w="full">
        {cards.map((c, idx) => {
          const show = flipped.includes(idx) || matched.has(idx);
          return (
            <Box
              key={idx}
              as="button"
              onClick={() => flip(idx)}
              h="88px"
              borderRadius="18px"
              boxShadow="0 4px 0 rgba(255,199,222,.4)"
              border={show ? "2.5px solid #FFDDEB" : "none"}
              background={show ? "white" : "linear-gradient(135deg,#FFC2DA,#CDB4F6)"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="34px"
              transition="transform .15s"
              _active={{ transform: "scale(.96)" }}
            >
              {show ? (
                c.emoji
              ) : (
                <Text color="white" fontSize="28px" lineHeight="1">
                  ♡
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {won && (
        <Text
          fontFamily="'Jersey 25', cursive"
          fontSize="20px"
          color="#C0577E"
          textAlign="center"
        >
          ✨ You matched them all!
        </Text>
      )}

      <GameFooter onBack={onBack}>
        <PillButton onClick={init}>{won ? "Play Again" : "Restart"}</PillButton>
      </GameFooter>
    </Box>
  );
};

// ─── JOURNALING DICE ─────────────────────────────────────────────────────────
interface Prompt {
  text: string;
  icon: React.ReactNode;
}

const JournalingDice = ({ onBack }: GameProps) => {
  const prompts: Prompt[] = [
    { text: "Draw your current mood as a pixel character", icon: <Edit3 size={16} /> },
    { text: "Write 3 small wins from today", icon: <Heart size={16} /> },
    { text: "Write a love letter to your future self", icon: <Gift size={16} /> },
    { text: "What is one thing that made you smile today?", icon: <Smile size={16} /> },
    { text: "Reflect on one thing you're proud of", icon: <BookOpen size={16} /> },
    { text: "Describe your ideal cozy corner", icon: <Coffee size={16} /> },
  ];

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    setRolling(true);
    setTimeout(() => {
      setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
      setRolling(false);
    }, 800);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap="20px" py="8px" w="full">
      <Box
        as="button"
        onClick={roll}
        w="120px"
        h="120px"
        bg="white"
        border="3px solid #FFDDEB"
        borderRadius="28px"
        boxShadow="0 6px 0 rgba(255,199,222,.45)"
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="transform .2s"
        className={rolling ? "animate-bounce" : ""}
        _hover={{ transform: "rotate(10deg)" }}
      >
        <Dice5 size={60} color="#F9A8CB" />
      </Box>

      {prompt && !rolling ? (
        <Box
          bg="white"
          border="2.5px solid #FFDDEB"
          borderRadius="20px"
          boxShadow="0 4px 0 rgba(255,199,222,.4)"
          p="18px 20px"
          w="full"
        >
          <Box display="flex" alignItems="center" gap="8px" color="#C0577E" mb="8px">
            {prompt.icon}
            <Text fontFamily="'Jersey 25', cursive" fontSize="16px" letterSpacing=".3px">
              Prompt of the Day
            </Text>
          </Box>
          <Text color="#5C4A63" fontSize="14px" fontWeight="600">
            {prompt.text}
          </Text>
        </Box>
      ) : (
        !rolling && (
          <Box textAlign="center">
            <Text color="#C0577E" fontWeight="700" fontSize="14px">
              Ready to reflect?
            </Text>
            <Text fontSize="12px" color="#A08B9B" fontStyle="italic">
              Click the dice to find your prompt.
            </Text>
          </Box>
        )
      )}

      <GameFooter onBack={onBack}>
        {prompt && !rolling && <PillButton onClick={roll}>Roll Again</PillButton>}
      </GameFooter>
    </Box>
  );
};

// ─── GAMES HUB ───────────────────────────────────────────────────────────────
interface GameMeta {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconColor: string;
}

const GAMES: GameMeta[] = [
  {
    id: "memory",
    name: "Sticker Match",
    desc: "Flip & match all 8 pairs",
    icon: <Brain size={26} />,
    bg: "#FFF0F6",
    border: "#FFDDEB",
    iconColor: "#F27DAB",
  },
  {
    id: "dice",
    name: "Journaling Dice",
    desc: "Roll for a writing prompt",
    icon: <Edit3 size={26} />,
    bg: "#FFFBF5",
    border: "#FFDDEB",
    iconColor: "#C0577E",
  },
];

export default function Games() {
  const [selected, setSelected] = useState<string | null>(null);
  const active = GAMES.find((g) => g.id === selected) ?? null;

  const renderGame = () => {
    switch (selected) {
      case "memory":
        return <MemoryMatch onBack={() => setSelected(null)} />;
      case "dice":
        return <JournalingDice onBack={() => setSelected(null)} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <SectionHeader title="Cozy Arcade" meta="Pick a game to play" />

      <Box display="flex" gap="22px" alignItems="flex-start">
        {/* Left: welcome card + game picker */}
        <Box width="420px" flexShrink={0} display="flex" flexDirection="column" gap="14px">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap="8px"
            padding="18px"
            borderRadius="24px"
            bg="white"
            border="2.5px solid #FFDDEB"
            boxShadow="0 6px 0 rgba(255,199,222,.45)"
          >
            <Image src="/Llama1.png" alt="Mascot" boxSize="84px" objectFit="contain" />
            <Text
              fontSize="13px"
              fontWeight="700"
              fontStyle="italic"
              color="#A08B9B"
              textAlign="center"
            >
              Welcome to the Cozy Arcade! Pick a game to play.
            </Text>
          </Box>

          {GAMES.map((g) => {
            const isActive = g.id === selected;
            return (
              <Box
                key={g.id}
                as="button"
                onClick={() => setSelected(g.id)}
                display="flex"
                alignItems="center"
                gap="14px"
                padding="14px 16px"
                borderRadius="20px"
                bg={g.bg}
                border={isActive ? "2.5px solid #F27DAB" : `2.5px solid ${g.border}`}
                boxShadow="0 5px 0 rgba(255,199,222,.35)"
                textAlign="left"
                cursor="pointer"
                transition="transform .12s"
                _hover={{ transform: "translateY(-1px)" }}
              >
                <Box
                  w="54px"
                  h="54px"
                  borderRadius="16px"
                  bg="white"
                  border="2px solid rgba(255,255,255,.9)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  color={g.iconColor}
                >
                  {g.icon}
                </Box>
                <Box flex="1" minW={0}>
                  <Text
                    fontFamily="'Jersey 25', cursive"
                    fontSize="25px"
                    color="#C0577E"
                    lineHeight="1.15"
                    letterSpacing=".3px"
                  >
                    {g.name}
                  </Text>
                  <Text fontSize="11.5px" fontWeight="600" color="#A08B9B">
                    {g.desc}
                  </Text>
                </Box>
                <Text fontSize="20px" color="#F9A8CB" flexShrink={0}>
                  ›
                </Text>
              </Box>
            );
          })}
        </Box>

        {/* Right: active game / placeholder */}
        <Box flex="1" minW={0}>
          {active ? (
            <SoftSpaceCard title={active.name} subtitle={active.desc}>
              {renderGame()}
            </SoftSpaceCard>
          ) : (
            <SoftSpaceCard headerless bodyPadding="48px 24px">
              <Box display="flex" flexDirection="column" alignItems="center" gap="10px">
                <Image src="/Llama1.png" alt="Mascot" boxSize="72px" objectFit="contain" />
                <Text
                  fontFamily="'Jersey 25', cursive"
                  fontSize="22px"
                  color="#C0577E"
                  textAlign="center"
                >
                  Pick a game to get started!
                </Text>
                <Text
                  fontSize="12.5px"
                  fontWeight="600"
                  fontStyle="italic"
                  color="#A08B9B"
                  textAlign="center"
                >
                  Choose from the list on the left ✨
                </Text>
              </Box>
            </SoftSpaceCard>
          )}
        </Box>
      </Box>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(-10px); }
            }
            .animate-bounce { animation: bounce 1s infinite; }
          `,
        }}
      />
    </Box>
  );
}
