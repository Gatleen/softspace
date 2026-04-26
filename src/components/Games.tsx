import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Image,
  IconButton,
  Center,
  Button as ChakraButton,
} from "@chakra-ui/react";
import {
  Heart,
  Brain,
  Dice5,
  Home,
  Sparkles,
  Coffee,
  Gift,
  Smile,
  BookOpen,
  Edit3,
  Grid3x3,
} from "lucide-react";

// ─── MEMORY MATCH ────────────────────────────────────────────────────────────
// 🎨 CUSTOMIZE: Swap these with your own sticker images or emoji!
const EMOJI_SET = ["🌸", "🍵", "🎀", "🌙", "⭐", "🦋", "🍓", "🌈"];

interface MemCard {
  id: number;
  emoji: string;
}

const MemoryMatch = () => {
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
    <VStack gap={4} w="full">
      <HStack justify="space-between" w="full" px={2}>
        <Text fontSize="sm" fontWeight="bold" color="pink.500">
          Moves: {moves}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color="purple.500">
          Matched: {matched.size / 2} / 8
        </Text>
      </HStack>

      <SimpleGrid columns={4} gap={2} w="full">
        {cards.map((c, idx) => {
          const show = flipped.includes(idx) || matched.has(idx);
          return (
            <Center
              key={idx}
              onClick={() => flip(idx)}
              h={{ base: "64px", md: "72px" }}
              bg={show ? "white" : matched.has(idx) ? "green.50" : "pink.300"}
              borderRadius="xl"
              cursor="pointer"
              boxShadow={show ? "inner" : "0 4px 0 rgba(219,39,119,0.3)"}
              border="3px solid"
              borderColor={
                matched.has(idx) ? "green.300" : show ? "pink.200" : "pink.400"
              }
              transition="all 0.25s"
              fontSize="28px"
              style={{ imageRendering: "pixelated" as React.CSSProperties["imageRendering"] }}
            >
              {show ? (
                c.emoji
              ) : (
                <Text color="white" fontWeight="900" fontSize="xl">
                  ?
                </Text>
              )}
            </Center>
          );
        })}
      </SimpleGrid>

      {won ? (
        <VStack>
          <Text fontWeight="bold" color="pink.500" fontSize="lg">
            ✨ You matched them all!
          </Text>
          <ChakraButton
            colorPalette="pink"
            rounded="full"
            size="sm"
            onClick={init}
          >
            Play Again
          </ChakraButton>
        </VStack>
      ) : (
        <ChakraButton
          colorPalette="pink"
          variant="outline"
          size="sm"
          rounded="full"
          onClick={init}
        >
          Restart
        </ChakraButton>
      )}
    </VStack>
  );
};

// ─── SNAKE & LADDER ──────────────────────────────────────────────────────────

// 🎨 CUSTOMIZE: Change emoji to use your own pixel art characters.
// Or replace with: <Image src="/tokens/cat.png" boxSize="16px" />
const PLAYER_TOKENS = ["🐱", "🐶"];

// 🐍 Snake: head → tail (player slides DOWN)
const SNAKES: Record<number, number> = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

// 🪜 Ladder: bottom → top (player climbs UP)
const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

/** Convert grid position (row 0=top, col 0=left) → board cell number 1–100 */
const getCellNum = (gridRow: number, gridCol: number): number => {
  const rowFromBottom = 9 - gridRow;
  const col = rowFromBottom % 2 === 0 ? gridCol : 9 - gridCol;
  return rowFromBottom * 10 + col + 1;
};

const SnakeLadder = () => {
  // Position 0 = not yet on the board (before first move)
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0); // 0=player, 1=cpu/p2
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [vsMode, setVsMode] = useState<"cpu" | "2p">("cpu");

  // Keep a ref so setTimeout closures always read the latest pos
  const posRef = useRef<[number, number]>([0, 0]);
  const doMoveRef = useRef<(player: number, roll: number) => void>((_p, _r) => {});

  const doMove = (player: number, roll: number) => {
    const cur = posRef.current;
    const from = cur[player];
    let to = from + roll;
    let msg = `${PLAYER_TOKENS[player]} rolled ${roll}`;

    if (to > 100) {
      msg += ` — overshoot! Stays at ${from === 0 ? "start" : from}`;
      setLog((l) => [msg, ...l].slice(0, 8));
      setTurn((t) => 1 - t);
      return;
    }

    if (SNAKES[to] !== undefined) {
      msg += ` → ${to} 🐍 slides to ${SNAKES[to]}`;
      to = SNAKES[to];
    } else if (LADDERS[to] !== undefined) {
      msg += ` → ${to} 🪜 climbs to ${LADDERS[to]}`;
      to = LADDERS[to];
    } else {
      msg += ` → ${to}`;
    }

    const next: [number, number] = [cur[0], cur[1]];
    next[player] = to;
    posRef.current = next;
    setPos(next);
    setLog((l) => [msg, ...l].slice(0, 8));

    if (to === 100) {
      setWinner(player);
    } else {
      setTurn((t) => 1 - t);
    }
  };

  // Keep ref fresh
  doMoveRef.current = doMove;

  // CPU auto-roll
  useEffect(() => {
    if (vsMode !== "cpu" || turn !== 1 || winner !== null || rolling) return;
    const t = setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDice(roll);
      doMoveRef.current?.(1, roll);
    }, 1100);
    return () => clearTimeout(t);
  }, [turn, vsMode, winner, rolling]);

  const handleRoll = () => {
    if (rolling || winner !== null) return;
    if (vsMode === "cpu" && turn === 1) return;
    setRolling(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks >= 10) {
        clearInterval(iv);
        const final = Math.floor(Math.random() * 6) + 1;
        setDice(final);
        setRolling(false);
        doMove(turn, final);
      }
    }, 80);
  };

  const reset = () => {
    const start: [number, number] = [0, 0];
    posRef.current = start;
    setPos(start);
    setTurn(0);
    setDice(1);
    setLog([]);
    setWinner(null);
    setRolling(false);
  };

  return (
    <VStack gap={3} w="full">
      {/*
        🎨 CUSTOMIZE BOARD:
        To use your own board image, add to the Box below:
          backgroundImage="url('/games/snakes-board.png')"
          backgroundSize="cover"
        Then set cell bg to "transparent" in renderCell.
      */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(10, 1fr)"
        w="full"
        border="3px solid"
        borderColor="pink.300"
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
      >
        {Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const n = getCellNum(r, c);
            const snake = SNAKES[n] !== undefined;
            const ladder = LADDERS[n] !== undefined;
            const p0Here = pos[0] === n;
            const p1Here = pos[1] === n;

            let bg = n % 2 === 0 ? "#fce4ec" : "#fdd8e5";
            if (snake) bg = "#ffcdd2";
            if (ladder) bg = "#dcedc8";
            if (n === 100) bg = "#fff9c4";

            return (
              <Box
                key={n}
                bg={bg}
                border="1px solid"
                borderColor="pink.100"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                position="relative"
                style={{ aspectRatio: "1" }}
              >
                <Text
                  fontSize={{ base: "6px", sm: "7px", md: "9px" }}
                  color="gray.400"
                  fontWeight="bold"
                  lineHeight="1.2"
                >
                  {n}
                </Text>
                {n === 100 && (
                  <Text fontSize={{ base: "10px", md: "13px" }} lineHeight="1">
                    🏆
                  </Text>
                )}
                {snake && (
                  <Text fontSize={{ base: "10px", md: "13px" }} lineHeight="1">
                    🐍
                  </Text>
                )}
                {ladder && (
                  <Text fontSize={{ base: "10px", md: "13px" }} lineHeight="1">
                    🪜
                  </Text>
                )}
                {(p0Here || p1Here) && (
                  <HStack
                    position="absolute"
                    bottom="0px"
                    gap="0px"
                    fontSize={{ base: "10px", md: "14px" }}
                  >
                    {p0Here && <Text lineHeight="1">{PLAYER_TOKENS[0]}</Text>}
                    {p1Here && <Text lineHeight="1">{PLAYER_TOKENS[1]}</Text>}
                  </HStack>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Positions + Dice */}
      <HStack w="full" justify="space-between" align="center">
        <VStack gap={0} align="start">
          <Text fontSize="xs" fontWeight="bold" color="pink.500">
            {PLAYER_TOKENS[0]} You:{" "}
            {pos[0] === 0 ? "off board" : `cell ${pos[0]}`}
          </Text>
          <Text fontSize="xs" fontWeight="bold" color="purple.500">
            {PLAYER_TOKENS[1]} {vsMode === "cpu" ? "CPU" : "P2"}:{" "}
            {pos[1] === 0 ? "off board" : `cell ${pos[1]}`}
          </Text>
        </VStack>

        {/* Dice — click to roll */}
        <Center
          w="56px"
          h="56px"
          bg="white"
          border="3px solid"
          borderColor={
            rolling ? "yellow.400" : turn === 0 ? "pink.300" : "purple.300"
          }
          borderRadius="xl"
          fontSize="28px"
          cursor={
            winner !== null || (vsMode === "cpu" && turn === 1)
              ? "default"
              : "pointer"
          }
          onClick={handleRoll}
          boxShadow="0 4px 0 rgba(0,0,0,0.1)"
          transition="transform 0.1s, box-shadow 0.1s"
          _active={{ transform: "translateY(3px)", boxShadow: "none" }}
          userSelect="none"
        >
          {DICE_FACES[dice - 1]}
        </Center>
      </HStack>

      {/* Turn status */}
      <Box
        w="full"
        p={2}
        px={3}
        bg="white"
        borderRadius="xl"
        borderLeft="4px solid"
        borderColor={turn === 0 ? "pink.300" : "purple.300"}
      >
        <Text
          fontSize="sm"
          fontWeight="bold"
          color={turn === 0 ? "pink.500" : "purple.500"}
        >
          {winner !== null
            ? `🎉 ${
                winner === 0
                  ? "You win!"
                  : vsMode === "cpu"
                  ? "CPU wins!"
                  : "P2 wins!"
              }`
            : turn === 0
            ? "Your turn — click the dice! 🎲"
            : vsMode === "cpu"
            ? "CPU is thinking... 🤔"
            : "P2's turn — click the dice! 🎲"}
        </Text>
      </Box>

      {/* Move log */}
      <Box w="full" maxH="72px" overflowY="auto" bg="white" borderRadius="xl" p={2}>
        {log.length === 0 ? (
          <Text fontSize="xs" color="gray.400" fontStyle="italic">
            Roll the dice to start!
          </Text>
        ) : (
          log.map((entry, i) => (
            <Text
              key={i}
              fontSize="xs"
              color={i === 0 ? "gray.700" : "gray.400"}
            >
              {entry}
            </Text>
          ))
        )}
      </Box>

      {/* Controls */}
      <HStack w="full" gap={2}>
        <ChakraButton
          size="sm"
          colorPalette="purple"
          variant="outline"
          flex={1}
          onClick={() => {
            setVsMode((v) => (v === "cpu" ? "2p" : "cpu"));
            reset();
          }}
        >
          Mode: {vsMode === "cpu" ? "vs CPU" : "2 Players"}
        </ChakraButton>
        <ChakraButton
          size="sm"
          colorPalette="pink"
          variant="outline"
          flex={1}
          onClick={reset}
        >
          Restart
        </ChakraButton>
      </HStack>
    </VStack>
  );
};

// ─── TIC TAC TOE ─────────────────────────────────────────────────────────────
type TTTBoard = (null | "X" | "O")[];

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

const checkWinner = (b: TTTBoard): "X" | "O" | "draw" | null => {
  for (const [a, c, d] of WINNING_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as "X" | "O";
  }
  if (b.every(Boolean)) return "draw";
  return null;
};

// Minimax — CPU plays as "O"
const minimax = (b: TTTBoard, isMax: boolean): number => {
  const res = checkWinner(b);
  if (res === "O") return 10;
  if (res === "X") return -10;
  if (res === "draw") return 0;
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = isMax ? "O" : "X";
    const score = minimax(b, !isMax);
    b[i] = null;
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
};

const getBestMove = (b: TTTBoard): number => {
  let best = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = "O";
    const score = minimax(b, false);
    b[i] = null;
    if (score > best) { best = score; move = i; }
  }
  return move;
};

const TicTacToe = () => {
  const [board, setBoard] = useState<TTTBoard>(Array(9).fill(null));
  const [playerTurn, setPlayerTurn] = useState(true); // true = player (X)
  const [vsMode, setVsMode] = useState<"cpu" | "2p">("cpu");
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [thinking, setThinking] = useState(false);

  const result = checkWinner(board);

  // CPU move
  useEffect(() => {
    if (vsMode !== "cpu" || playerTurn || result || thinking) return;
    setThinking(true);
    const t = setTimeout(() => {
      setBoard((prev) => {
        const next = [...prev] as TTTBoard;
        const move = getBestMove(next);
        if (move === -1) return prev;
        next[move] = "O";
        const r = checkWinner(next);
        if (r) setScores((s) => ({ ...s, [r]: s[r as keyof typeof s] + 1 }));
        return next;
      });
      setPlayerTurn(true);
      setThinking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [playerTurn, vsMode, result, thinking]);

  const handleClick = (i: number) => {
    if (board[i] || result || thinking) return;
    if (vsMode === "cpu" && !playerTurn) return;

    setBoard((prev) => {
      const next = [...prev] as TTTBoard;
      next[i] = playerTurn ? "X" : "O";
      const r = checkWinner(next);
      if (r) setScores((s) => ({ ...s, [r]: s[r as keyof typeof s] + 1 }));
      return next;
    });
    setPlayerTurn((t) => !t);
  };

  const reset = (keepScores = true) => {
    setBoard(Array(9).fill(null));
    setPlayerTurn(true);
    setThinking(false);
    if (!keepScores) setScores({ X: 0, O: 0, draw: 0 });
  };

  const getWinningCells = (): number[] => {
    for (const [a, b, c] of WINNING_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c])
        return [a, b, c];
    }
    return [];
  };
  const winCells = getWinningCells();

  const statusMsg = () => {
    if (result === "draw") return "It's a draw! 🤝";
    if (result === "X") return vsMode === "cpu" ? "You win! 🎉" : "X wins! 🎉";
    if (result === "O") return vsMode === "cpu" ? "CPU wins! 🤖" : "O wins! 🎉";
    if (vsMode === "cpu")
      return playerTurn ? "Your turn (✕)" : "CPU is thinking...";
    return playerTurn ? "X's turn (✕)" : "O's turn (○)";
  };

  return (
    <VStack gap={4} w="full" align="center">
      {/* Score bar */}
      <HStack
        w="full"
        justify="space-between"
        bg="white"
        borderRadius="2xl"
        p={3}
        boxShadow="sm"
      >
        <VStack gap={0}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold">
            {vsMode === "cpu" ? "YOU" : "X"}
          </Text>
          <Text fontSize="2xl" fontWeight="900" color="pink.500" lineHeight="1">
            {scores.X}
          </Text>
        </VStack>
        <VStack gap={0}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold">DRAW</Text>
          <Text fontSize="2xl" fontWeight="900" color="gray.400" lineHeight="1">
            {scores.draw}
          </Text>
        </VStack>
        <VStack gap={0}>
          <Text fontSize="xs" color="gray.400" fontWeight="bold">
            {vsMode === "cpu" ? "CPU" : "O"}
          </Text>
          <Text fontSize="2xl" fontWeight="900" color="purple.500" lineHeight="1">
            {scores.O}
          </Text>
        </VStack>
      </HStack>

      {/* Board */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap="10px"
        p={4}
        bg="pink.50"
        borderRadius="3xl"
        boxShadow="inner"
      >
        {board.map((cell, i) => {
          const isWin = winCells.includes(i);
          return (
            <Center
              key={i}
              onClick={() => handleClick(i)}
              w={{ base: "88px", md: "100px" }}
              h={{ base: "88px", md: "100px" }}
              bg={isWin ? (cell === "X" ? "pink.100" : "purple.100") : "white"}
              borderRadius="2xl"
              cursor={cell || result ? "default" : "pointer"}
              border="3px solid"
              borderColor={
                isWin
                  ? cell === "X"
                    ? "pink.400"
                    : "purple.400"
                  : "pink.100"
              }
              boxShadow={isWin ? "none" : "0 4px 0 rgba(0,0,0,0.06)"}
              transition="all 0.15s"
              _hover={
                !cell && !result
                  ? { transform: "translateY(-2px)", borderColor: "pink.300" }
                  : {}
              }
            >
              {cell === "X" && (
                <Text
                  fontSize="3xl"
                  fontWeight="900"
                  color="pink.500"
                  lineHeight="1"
                  style={{ fontFamily: "monospace" }}
                >
                  ✕
                </Text>
              )}
              {cell === "O" && (
                <Text
                  fontSize="3xl"
                  fontWeight="900"
                  color="purple.500"
                  lineHeight="1"
                  style={{ fontFamily: "monospace" }}
                >
                  ○
                </Text>
              )}
            </Center>
          );
        })}
      </Box>

      {/* Status */}
      <Box
        px={4}
        py={2}
        bg="white"
        borderRadius="full"
        borderLeft="4px solid"
        borderColor={
          result === "X"
            ? "pink.400"
            : result === "O"
            ? "purple.400"
            : result === "draw"
            ? "gray.300"
            : playerTurn
            ? "pink.300"
            : "purple.300"
        }
        w="full"
      >
        <Text
          fontWeight="bold"
          fontSize="sm"
          color={
            result === "X"
              ? "pink.500"
              : result === "O"
              ? "purple.500"
              : "gray.600"
          }
        >
          {statusMsg()}
        </Text>
      </Box>

      {/* Controls */}
      <HStack w="full" gap={2}>
        <ChakraButton
          size="sm"
          colorPalette="purple"
          variant="outline"
          flex={1}
          onClick={() => {
            setVsMode((v) => (v === "cpu" ? "2p" : "cpu"));
            reset(false);
          }}
        >
          Mode: {vsMode === "cpu" ? "vs CPU" : "2 Players"}
        </ChakraButton>
        {result ? (
          <ChakraButton
            size="sm"
            colorPalette="pink"
            flex={1}
            onClick={() => reset(true)}
          >
            Next Round
          </ChakraButton>
        ) : (
          <ChakraButton
            size="sm"
            colorPalette="pink"
            variant="outline"
            flex={1}
            onClick={() => reset(false)}
          >
            Restart
          </ChakraButton>
        )}
      </HStack>
    </VStack>
  );
};

// ─── JOURNALING DICE ─────────────────────────────────────────────────────────
interface Prompt {
  text: string;
  icon: React.ReactNode;
}

const JournalingDice = () => {
  const prompts: Prompt[] = [
    { text: "Draw your current mood as a pixel character", icon: <Edit3 /> },
    { text: "Write 3 small wins from today", icon: <Heart /> },
    { text: "Write a love letter to your future self", icon: <Gift /> },
    { text: "What is one thing that made you smile today?", icon: <Smile /> },
    { text: "Reflect on one thing you're proud of", icon: <BookOpen /> },
    { text: "Describe your ideal cozy corner", icon: <Coffee /> },
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
    <VStack gap={8} py={4} w="full">
      <Center
        onClick={roll}
        w="120px"
        h="120px"
        bg="white"
        border="8px solid"
        borderColor="pink.100"
        borderRadius="3xl"
        boxShadow="2xl"
        cursor="pointer"
        transition="all 0.2s"
        className={rolling ? "animate-bounce" : ""}
        _hover={{ transform: "rotate(12deg)" }}
      >
        <Dice5 size={64} color="#fbb6ce" />
      </Center>

      {prompt && !rolling ? (
        <Box
          bg="white"
          p={6}
          borderRadius="2xl"
          boxShadow="xl"
          borderLeft="8px solid"
          borderColor="pink.400"
          w="full"
        >
          <HStack color="pink.500" fontWeight="bold" mb={2}>
            {prompt.icon}
            <Text>Prompt of the Day</Text>
          </HStack>
          <Text color="gray.700" fontWeight="medium">
            {prompt.text}
          </Text>
        </Box>
      ) : (
        !rolling && (
          <VStack textAlign="center">
            <Text color="pink.400" fontWeight="bold">
              Ready to reflect?
            </Text>
            <Text fontSize="sm" color="gray.400" fontStyle="italic">
              Click the dice to find your prompt.
            </Text>
          </VStack>
        )
      )}
    </VStack>
  );
};

// ─── GAMES HUB ───────────────────────────────────────────────────────────────
export default function Games() {
  const [view, setView] = useState("hub");

  const games = [
    {
      id: "memory",
      name: "Sticker Match",
      desc: "Flip & match all 8 pairs",
      icon: <Brain />,
    },
    {
      id: "snakeladder",
      name: "Snake & Ladder",
      desc: "Climb ladders, dodge snakes",
      icon: <Dice5 />,
    },
    {
      id: "tictactoe",
      name: "Tic Tac Toe",
      desc: "Beat the unbeatable CPU… if you can",
      icon: <Grid3x3 />,
    },
    {
      id: "dice",
      name: "Journaling Dice",
      desc: "Roll for a writing prompt",
      icon: <Edit3 />,
    },
  ];

  const renderView = () => {
    switch (view) {
      case "memory":
        return <MemoryMatch />;
      case "snakeladder":
        return <SnakeLadder />;
      case "tictactoe":
        return <TicTacToe />;
      case "dice":
        return <JournalingDice />;
      default:
        return (
          <VStack gap={4} w="full">
            <VStack mb={2}>
              <Image
                src="/llama.png"
                alt="Mascot"
                w="80px"
                h="80px"
                objectFit="contain"
              />
              <Text
                color="gray.500"
                fontStyle="italic"
                fontSize="sm"
                textAlign="center"
                px={4}
              >
                Welcome to the Cozy Arcade!
                <br />
                Pick a game to play. ✨
              </Text>
            </VStack>
            {games.map((g) => (
              <HStack
                key={g.id}
                as="button"
                onClick={() => setView(g.id)}
                w="full"
                p={5}
                bg="white"
                borderRadius="3xl"
                shadow="lg"
                borderBottom="6px solid"
                borderColor="blackAlpha.50"
                transition="transform 0.2s"
                _hover={{ transform: "scale(1.02)" }}
              >
                <Center
                  p={3}
                  borderRadius="2xl"
                  bg="pink.50"
                  color="pink.400"
                  flexShrink={0}
                >
                  {g.icon}
                </Center>
                <VStack align="start" gap={0}>
                  <Text fontWeight="bold" fontSize="lg" color="gray.600">
                    {g.name}
                  </Text>
                  <Text fontSize="xs" color="pink.300" fontWeight="bold">
                    {g.desc}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        );
    }
  };

  return (
    <Box
      minH="100vh"
      p={4}
      bg="#fff5f7"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      {/* Header */}
      <HStack w="full" maxW="lg" mb={6} justify="space-between">
        <HStack gap={3}>
          <Center p={2} bg="pink.300" borderRadius="xl" shadow="lg">
            <Heart color="white" fill="white" />
          </Center>
          <Box>
            <Text
              fontSize="2xl"
              fontWeight="900"
              color="pink.600"
              lineHeight="1"
            >
              {view === "hub"
                ? "Cozy Arcade"
                : games.find((g) => g.id === view)?.name ?? ""}
            </Text>
            <Text
              fontSize="10px"
              fontWeight="bold"
              color="pink.400"
              textTransform="uppercase"
              letterSpacing="widest"
            >
              A Pixelated Self-Care Zone
            </Text>
          </Box>
        </HStack>
        {view !== "hub" && (
          <IconButton
            aria-label="home"
            onClick={() => setView("hub")}
            variant="ghost"
            bg="white"
            borderRadius="full"
            shadow="md"
            color="pink.400"
          >
            <Home size={20} />
          </IconButton>
        )}
      </HStack>

      {/* Game area */}
      <Box
        w="full"
        maxW="lg"
        bg="rgba(255,183,197,0.15)"
        borderRadius="3xl"
        p={{ base: 4, md: 6 }}
        shadow="2xl"
        backdropFilter="blur(10px)"
        border="4px solid white"
        minH="500px"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        {renderView()}
      </Box>

      <HStack mt={6} gap={2} color="pink.300" fontWeight="bold">
        <Sparkles size={16} />
        <Text fontSize="sm">Your daily dose of calm</Text>
        <Sparkles size={16} />
      </HStack>

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