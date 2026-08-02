import React, { useState, useEffect, useRef } from "react";
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
  Grid3x3,
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

const SnakeLadder = ({ onBack }: GameProps) => {
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
    <Box display="flex" flexDirection="column" gap="12px" w="full">
      <Box display="flex" gap="8px" flexWrap="wrap">
        <StatPill>
          {PLAYER_TOKENS[0]} You: {pos[0] === 0 ? "off board" : `cell ${pos[0]}`}
        </StatPill>
        <StatPill>
          {PLAYER_TOKENS[1]} {vsMode === "cpu" ? "CPU" : "P2"}:{" "}
          {pos[1] === 0 ? "off board" : `cell ${pos[1]}`}
        </StatPill>
      </Box>

      {/*
        🎨 CUSTOMIZE BOARD:
        To use your own board image, add to the Box below:
          backgroundImage="url('/games/snakes-board.png')"
          backgroundSize="cover"
        Then set cell bg to "transparent" in the map below.
      */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(10, 1fr)"
        w="full"
        border="2px solid #FFDDEB"
        borderRadius="18px"
        overflow="hidden"
        boxShadow="0 4px 0 rgba(255,199,222,.4)"
      >
        {Array.from({ length: 10 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => {
            const n = getCellNum(r, c);
            const snake = SNAKES[n] !== undefined;
            const ladder = LADDERS[n] !== undefined;
            const p0Here = pos[0] === n;
            const p1Here = pos[1] === n;

            let bg = n % 2 === 0 ? "#FFF6FA" : "#FFFBF5";
            if (snake) bg = "#FFDDEB";
            if (ladder) bg = "#EEDCFB";
            if (n === 100) bg = "#D8E9FB";

            return (
              <Box
                key={n}
                bg={bg}
                border="1px solid rgba(255,221,235,.6)"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                position="relative"
                style={{ aspectRatio: "1" }}
              >
                <Text fontSize="7px" color="#C2AECF" fontWeight="bold" lineHeight="1.2">
                  {n}
                </Text>
                {n === 100 && (
                  <Text fontSize="12px" lineHeight="1">
                    🏆
                  </Text>
                )}
                {snake && (
                  <Text fontSize="12px" lineHeight="1">
                    🐍
                  </Text>
                )}
                {ladder && (
                  <Text fontSize="12px" lineHeight="1">
                    🪜
                  </Text>
                )}
                {(p0Here || p1Here) && (
                  <Box position="absolute" bottom="0px" display="flex" fontSize="13px">
                    {p0Here && <Text lineHeight="1">{PLAYER_TOKENS[0]}</Text>}
                    {p1Here && <Text lineHeight="1">{PLAYER_TOKENS[1]}</Text>}
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Dice */}
      <Box display="flex" justifyContent="center">
        <Box
          as="button"
          onClick={handleRoll}
          w="56px"
          h="56px"
          bg="white"
          border="2.5px solid"
          borderColor={turn === 0 ? "#FFC2DA" : "#CDB4F6"}
          borderRadius="16px"
          fontSize="26px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={winner !== null || (vsMode === "cpu" && turn === 1) ? "default" : "pointer"}
          boxShadow="0 4px 0 rgba(196,87,127,.25)"
          transition="transform .1s"
          _active={{ transform: "translateY(3px)" }}
          userSelect="none"
        >
          {DICE_FACES[dice - 1]}
        </Box>
      </Box>

      {/* Turn status */}
      <Box
        w="full"
        px="14px"
        py="10px"
        bg={turn === 0 ? "#FFF0F6" : "#F6F0FF"}
        borderRadius="14px"
        borderLeft="4px solid"
        borderColor={turn === 0 ? "#F9A8CB" : "#CDB4F6"}
      >
        <Text fontSize="13px" fontWeight="700" color={turn === 0 ? "#C0577E" : "#7A5AA6"}>
          {winner !== null
            ? `🎉 ${
                winner === 0 ? "You win!" : vsMode === "cpu" ? "CPU wins!" : "P2 wins!"
              }`
            : turn === 0
            ? "Your turn — click the dice! 🎲"
            : vsMode === "cpu"
            ? "CPU is thinking... 🤔"
            : "P2's turn — click the dice! 🎲"}
        </Text>
      </Box>

      {/* Move log */}
      <Box
        w="full"
        maxH="72px"
        overflowY="auto"
        bg="#FFFBF5"
        border="1.5px solid #FFDDEB"
        borderRadius="14px"
        p="10px"
      >
        {log.length === 0 ? (
          <Text fontSize="11.5px" color="#A08B9B" fontStyle="italic">
            Roll the dice to start!
          </Text>
        ) : (
          log.map((entry, i) => (
            <Text key={i} fontSize="11.5px" color={i === 0 ? "#5C4A63" : "#C2AECF"}>
              {entry}
            </Text>
          ))
        )}
      </Box>

      <GameFooter onBack={onBack}>
        <SecondaryPillButton
          onClick={() => {
            setVsMode((v) => (v === "cpu" ? "2p" : "cpu"));
            reset();
          }}
        >
          Mode: {vsMode === "cpu" ? "vs CPU" : "2 Players"}
        </SecondaryPillButton>
        <PillButton onClick={reset}>Restart</PillButton>
      </GameFooter>
    </Box>
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

const TicTacToe = ({ onBack }: GameProps) => {
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

  const statusColor =
    result === "X" ? "#F27DAB" : result === "O" ? "#8A6BD1" : "#5C4A63";
  const statusBorder =
    result === "X" ? "#F9A8CB" : result === "O" ? "#CDB4F6" : result === "draw" ? "#C2AECF" : playerTurn ? "#F9A8CB" : "#CDB4F6";

  return (
    <Box display="flex" flexDirection="column" gap="14px" w="full" alignItems="center">
      {/* Score bar */}
      <Box
        w="full"
        display="flex"
        justifyContent="space-between"
        gap="10px"
        bg="#FFFBF5"
        border="2px solid #FFDDEB"
        borderRadius="18px"
        p="12px"
      >
        <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap="2px" bg="#FFF0F6" borderRadius="14px" py="8px">
          <Text fontSize="10px" color="#A08B9B" fontWeight="800">
            {vsMode === "cpu" ? "YOU" : "X"}
          </Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize="28px" color="#F27DAB" lineHeight="1">
            {scores.X}
          </Text>
        </Box>
        <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap="2px" bg="white" borderRadius="14px" py="8px">
          <Text fontSize="10px" color="#A08B9B" fontWeight="800">
            DRAW
          </Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize="28px" color="#A08B9B" lineHeight="1">
            {scores.draw}
          </Text>
        </Box>
        <Box flex="1" display="flex" flexDirection="column" alignItems="center" gap="2px" bg="#F6F0FF" borderRadius="14px" py="8px">
          <Text fontSize="10px" color="#A08B9B" fontWeight="800">
            {vsMode === "cpu" ? "CPU" : "O"}
          </Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize="28px" color="#8A6BD1" lineHeight="1">
            {scores.O}
          </Text>
        </Box>
      </Box>

      {/* Board */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gap="10px"
        p="14px"
        bg="#FFFBF5"
        border="2px solid #FFDDEB"
        borderRadius="20px"
      >
        {board.map((cell, i) => {
          const isWin = winCells.includes(i);
          return (
            <Box
              key={i}
              as="button"
              onClick={() => handleClick(i)}
              w="96px"
              h="96px"
              bg={isWin ? (cell === "X" ? "#FFDDEB" : "#EEDCFB") : "white"}
              borderRadius="16px"
              cursor={cell || result ? "default" : "pointer"}
              border="2.5px solid"
              borderColor={isWin ? (cell === "X" ? "#F27DAB" : "#8A6BD1") : "#FFDDEB"}
              boxShadow="0 4px 0 rgba(255,199,222,.4)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="transform .1s"
              _active={{ transform: !cell && !result ? "translateY(2px)" : "none" }}
            >
              {cell === "X" && (
                <Text fontFamily="'Jersey 25', cursive" fontSize="44px" color="#F27DAB" lineHeight="1">
                  ✕
                </Text>
              )}
              {cell === "O" && (
                <Text fontFamily="'Jersey 25', cursive" fontSize="44px" color="#8A6BD1" lineHeight="1">
                  ○
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Status */}
      <Box
        px="16px"
        py="9px"
        bg="#FFF0F6"
        borderRadius="999px"
        borderLeft="4px solid"
        borderColor={statusBorder}
        w="full"
      >
        <Text fontWeight="700" fontSize="13px" color={statusColor}>
          {statusMsg()}
        </Text>
      </Box>

      <GameFooter onBack={onBack}>
        <SecondaryPillButton
          onClick={() => {
            setVsMode((v) => (v === "cpu" ? "2p" : "cpu"));
            reset(false);
          }}
        >
          Mode: {vsMode === "cpu" ? "vs CPU" : "2 Players"}
        </SecondaryPillButton>
        {result ? (
          <PillButton onClick={() => reset(true)}>Next Round</PillButton>
        ) : (
          <PillButton onClick={() => reset(false)}>Restart</PillButton>
        )}
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
    id: "snakeladder",
    name: "Snake & Ladder",
    desc: "Climb ladders, dodge snakes",
    icon: <Dice5 size={26} />,
    bg: "#F6F0FF",
    border: "#EEDCFB",
    iconColor: "#8A6BD1",
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    desc: "Beat the unbeatable CPU… if you can",
    icon: <Grid3x3 size={26} />,
    bg: "#F1F8FE",
    border: "#D8E9FB",
    iconColor: "#5B8FD6",
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
      case "snakeladder":
        return <SnakeLadder onBack={() => setSelected(null)} />;
      case "tictactoe":
        return <TicTacToe onBack={() => setSelected(null)} />;
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
