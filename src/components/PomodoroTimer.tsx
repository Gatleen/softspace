import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Box, Button, HStack, Text, VStack, Input, Image,
} from "@chakra-ui/react";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Coffee, BookOpen, Zap } from "lucide-react";

// ─── Theme config ─────────────────────────────────────────────────────────────
const THEMES = {
  forest: { name: "Mystic Meadows", bg: "#d1fae5", accent: "#16a34a", image: "/Mystic Meadows.png" },
  ocean:  { name: "Under the Sea",  bg: "#cffafe", accent: "#0e7490", image: "/Under the Sea.png"  },
  sunset: { name: "Autumn Forest",  bg: "#ffedd5", accent: "#ea580c", image: "/Autumn Forest.png"  },
  berry:  { name: "Out in Space",   bg: "#ede9fe", accent: "#7c3aed", image: "/Out in Space.png"   },
};

// ─── Music tracks (independent of theme) ─────────────────────────────────────
const TRACKS = {
  meadows: { label: "Mystic Meadows 🌿", src: "/audio/meadows-ambient.mp3" },
  ocean:   { label: "Under the Sea 🌊",  src: "/audio/ocean-ambient.mp3"  },
  forest:  { label: "Autumn Forest 🍂",  src: "/audio/forest-ambient.mp3" },
  space:   { label: "Out in Space 🌌",   src: "/audio/space-ambient.mp3"  },
  rain:    { label: "Rainy Day ☔",      src: "/audio/rain-ambient.mp3"   },
  cafe:    { label: "Café Vibes ☕",     src: "/audio/cafe-ambient.mp3"   },
  lofi:    { label: "Lo-fi Beats 🎵",   src: "/audio/lofi-ambient.mp3"   },
};

// ─── Timer modes ──────────────────────────────────────────────────────────────
type TimerMode = "focus" | "short" | "long";

const MODES: Record<TimerMode, { label: string; defaultMins: number; icon: ReactNode; color: string }> = {
  focus: { label: "Focus",       defaultMins: 25, icon: <BookOpen size={14} />, color: "#7c3aed" },
  short: { label: "Short Break", defaultMins: 5,  icon: <Coffee   size={14} />, color: "#0891b2" },
  long:  { label: "Long Break",  defaultMins: 15, icon: <Zap      size={14} />, color: "#059669" },
};

interface Props { onExit: () => void; }

// ─── Sand colour based on remaining fraction (urgency indicator) ─────────────
const sandColor = (pct: number) =>
  pct > 0.5  ? "#22c55e" :
  pct > 0.25 ? "#eab308" :
  pct > 0.1  ? "#f97316" : "#ef4444";

// ─── Hourglass SVG with bezier-curved glass walls ────────────────────────────
const Hourglass = ({ pct, running }: { pct: number; running: boolean }) => {
  const col   = sandColor(pct);
  const spent = 1 - pct;

  // Cubic-bezier glass paths — wide at caps, curves to narrow neck
  const topPath = "M 14,10 L 66,10 C 70,52 44,74 40,78 C 36,74 10,52 14,10 Z";
  const botPath = "M 40,82 C 44,86 70,108 66,150 L 14,150 C 10,108 36,86 40,82 Z";

  // Sand rectangles clipped to glass shape (chamber height = 68px each)
  const topFillY = 10 + spent * 68;          // top edge of remaining top sand
  const topFillH = Math.max(0, 78 - topFillY);
  const botFillH = spent * 68;               // height of accumulated bottom sand

  return (
    <svg viewBox="0 0 80 162" width="88" height="179"
      style={{ overflow: "visible", filter: `drop-shadow(0 3px 12px ${col}44)` }}>
      <defs>
        <clipPath id="hg-top"><path d={topPath} /></clipPath>
        <clipPath id="hg-bot"><path d={botPath} /></clipPath>
      </defs>

      {/* Glass backgrounds */}
      <path d={topPath} fill="rgba(0,0,0,0.05)" />
      <path d={botPath} fill="rgba(0,0,0,0.05)" />
      <rect x="38" y="78" width="4" height="4" fill="rgba(0,0,0,0.05)" />

      {/* Top sand — shrinks from top downward as time passes */}
      {topFillH > 0.5 && (
        <rect x="0" y={topFillY} width="80" height={topFillH}
          fill={col} opacity={0.80} clipPath="url(#hg-top)" />
      )}

      {/* Bottom sand — grows from neck downward as time passes */}
      {botFillH > 0.5 && (
        <rect x="0" y="82" width="80" height={botFillH}
          fill={col} opacity={0.80} clipPath="url(#hg-bot)" />
      )}

      {/* Falling grain through neck */}
      {running && pct > 0.01 && pct < 0.99 && (
        <circle cx="40" r="1.4" fill={col}>
          <animate attributeName="cy" values="79;81" dur="0.45s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="0.45s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Glass highlight — subtle shine on left wall */}
      <path d="M 18,14 C 16,46 26,66 38,74" fill="none"
        stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 18,148 C 16,116 26,96 38,86" fill="none"
        stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Glass outlines */}
      <path d={topPath} fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1.5" />
      <path d={botPath} fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1.5" />

      {/* Caps */}
      <rect x="10" y="3"   width="60" height="9" rx="4" fill="rgba(0,0,0,0.18)" />
      <rect x="10" y="150" width="60" height="9" rx="4" fill="rgba(0,0,0,0.18)" />

      {/* Done indicator */}
      {pct <= 0.01 && (
        <text x="40" y="48" textAnchor="middle" fontSize="20" fill={col}>✓</text>
      )}
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const PomodoroTimer = ({ onExit }: Props) => {
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>("berry");
  const [mode,     setMode]     = useState<TimerMode>("focus");
  const [focusMins, setFocusMins] = useState(25);
  const [totalSecs, setTotalSecs] = useState(25 * 60);
  const [timeLeft,  setTimeLeft]  = useState(25 * 60);
  const [running,   setRunning]   = useState(false);
  const [musicOn,   setMusicOn]   = useState(false);
  const [trackKey,  setTrackKey]  = useState<keyof typeof TRACKS>("meadows");
  const [sessions,  setSessions]  = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const theme = THEMES[themeKey];
  const pct   = totalSecs > 0 ? timeLeft / totalSecs : 0;
  const col   = sandColor(pct);

  // Audio: reinitialise when track selection changes
  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = new Audio(TRACKS[trackKey].src);
    audioRef.current.loop   = true;
    audioRef.current.volume = 0.4;
    if (musicOn && running) audioRef.current.play().catch(() => {});
    return () => { audioRef.current?.pause(); };
  }, [trackKey]); // eslint-disable-line

  // Sync music with running + musicOn
  useEffect(() => {
    if (musicOn && running) audioRef.current?.play().catch(() => {});
    else                    audioRef.current?.pause();
  }, [musicOn, running]);

  // Countdown ticker
  useEffect(() => {
    if (!running) return;
    if (timeLeft === 0) {
      setRunning(false);
      if (mode === "focus") {
        setSessions((s) => s + 1);
        // Browser notification
        if (Notification.permission === "granted") {
          new Notification("🍅 Focus session done!", {
            body: "Time for a break. You earned it!",
            icon: "/Favicon.png",
          });
        }
      }
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [running, timeLeft, mode]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setRunning(false);
    const mins = m === "focus" ? focusMins : MODES[m].defaultMins;
    setTotalSecs(mins * 60);
    setTimeLeft(mins * 60);
  };

  const reset = () => {
    setRunning(false);
    const mins = mode === "focus" ? focusMins : MODES[mode].defaultMins;
    setTotalSecs(mins * 60);
    setTimeLeft(mins * 60);
  };

  const onFocusMinsChange = (v: string) => {
    const n = parseInt(v);
    if (!isNaN(n) && n > 0) {
      setFocusMins(n);
      if (mode === "focus") {
        setRunning(false);
        setTotalSecs(n * 60);
        setTimeLeft(n * 60);
      }
    }
  };

  const requestNotifPerm = () => {
    if (Notification.permission === "default") Notification.requestPermission();
  };

  return (
    <Box
      w="100%"
      minH="100vh"
      py={10}
      bg={theme.bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      transition="background-color 0.8s ease"
    >
      <Box
        p={8}
        borderRadius="3xl"
        bg="white"
        boxShadow="0 20px 60px rgba(0,0,0,0.12)"
        textAlign="center"
        maxW="400px"
        w="90%"
        border="3px solid"
        borderColor="whiteAlpha.800"
      >
        {/* ── Theme image ── */}
        <Box mb={4} borderRadius="2xl" overflow="hidden"
          border="3px solid" style={{ borderColor: theme.bg }}>
          <Image src={theme.image} alt={theme.name}
            objectFit="contain" w="100%" maxH="160px" opacity={0.95}
            transition="all 0.5s ease" bg={theme.bg} />
        </Box>

        {/* ── Theme dots ── */}
        <HStack justify="center" mb={3} gap={3}>
          {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
            <Box
              key={k}
              as="button"
              w="26px" h="26px" borderRadius="full"
              style={{ background: THEMES[k].bg }}
              border={themeKey === k ? `3px solid ${THEMES[k].accent}` : "2px solid transparent"}
              transition="all 0.2s"
              onClick={() => { setThemeKey(k); setRunning(false); }}
              _hover={{ transform: "scale(1.25)" }}
            />
          ))}
        </HStack>

        <Text fontWeight="800" fontSize="md" mb={4} style={{ color: theme.accent }}>
          {theme.name}
        </Text>

        {/* ── Mode tabs ── */}
        <HStack justify="center" mb={5} bg="gray.50" p="5px" borderRadius="full" gap={1}>
          {(Object.keys(MODES) as TimerMode[]).map((m) => {
            const active = mode === m;
            return (
              <Box
                key={m}
                as="button"
                flex={1}
                px={3} py="6px"
                borderRadius="full"
                style={{ background: active ? MODES[m].color : "transparent" }}
                transition="all 0.2s"
                onClick={() => switchMode(m)}
              >
                <HStack justify="center" gap={1}>
                  <Box style={{ color: active ? "white" : "#9ca3af" }}>
                    {MODES[m].icon}
                  </Box>
                  <Text
                    fontSize="11px"
                    fontWeight="800"
                    color={active ? "white" : "gray.400"}
                  >
                    {MODES[m].label}
                  </Text>
                </HStack>
              </Box>
            );
          })}
        </HStack>

        {/* ── Hourglass + time ── */}
        <VStack gap={1} mb={4}>
          <Hourglass pct={pct} running={running} />
          <Text
            fontSize="5xl"
            fontWeight="900"
            letterSpacing="tight"
            lineHeight="1"
            style={{ color: theme.accent }}
            transition="color 0.5s ease"
          >
            {fmt(timeLeft)}
          </Text>
          {sessions > 0 && (
            <Text fontSize="xs" color="gray.400" fontWeight="700" mt={1}>
              🍅 {sessions} session{sessions !== 1 ? "s" : ""} done today
            </Text>
          )}
        </VStack>

        {/* ── Controls ── */}
        <VStack gap={3}>
          <HStack gap={3} justify="center">
            {/* Play / Pause */}
            <Box
              as="button"
              w="56px" h="56px"
              borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              color="white"
              style={{ background: theme.accent }}
              boxShadow={`0 4px 16px ${theme.accent}66`}
              transition="all 0.2s"
              _hover={{ transform: "scale(1.08)" }}
              _active={{ transform: "scale(0.95)" }}
              onClick={() => { setRunning((r) => !r); requestNotifPerm(); }}
            >
              {running ? <Pause size={22} /> : <Play size={22} />}
            </Box>

            {/* Reset */}
            <Box
              as="button"
              w="44px" h="44px"
              borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              bg="gray.100"
              color="gray.500"
              transition="all 0.2s"
              _hover={{ bg: "gray.200", transform: "rotate(-30deg)" }}
              onClick={reset}
            >
              <RotateCcw size={18} />
            </Box>

            {/* Music */}
            <Box
              as="button"
              w="44px" h="44px"
              borderRadius="full"
              display="flex" alignItems="center" justifyContent="center"
              style={{ background: musicOn ? theme.accent : undefined }}
              bg={musicOn ? undefined : "gray.100"}
              color={musicOn ? "white" : "gray.400"}
              transition="all 0.2s"
              _hover={{ transform: "scale(1.05)" }}
              onClick={() => setMusicOn((m) => !m)}
              title={musicOn ? "Mute music" : "Play ambient music"}
            >
              {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Box>
          </HStack>

          {/* Custom focus duration */}
          {mode === "focus" && (
            <HStack justify="center">
              <Text fontSize="sm" fontWeight="700" color="gray.400">
                Focus (mins):
              </Text>
              <Input
                w="64px"
                size="sm"
                type="number"
                value={focusMins}
                onChange={(e) => onFocusMinsChange(e.target.value)}
                textAlign="center"
                borderRadius="lg"
                borderColor="gray.200"
                _focus={{ borderColor: col, boxShadow: `0 0 0 2px ${col}33` }}
              />
            </HStack>
          )}

          {/* Music track selector */}
          {musicOn && (
            <Box px={3} py={2.5} bg="gray.50" borderRadius="xl" w="100%">
              <Text fontSize="10px" fontWeight="800" color="gray.400" letterSpacing="wider" mb={1.5}>
                🎵 SELECT TRACK
              </Text>
              <select
                value={trackKey}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "none",
                  background: "white", fontSize: "12px", fontWeight: 600, color: "#374151",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)", outline: "none", cursor: "pointer" }}
                onChange={(e) => setTrackKey(e.target.value as keyof typeof TRACKS)}
              >
                {(Object.entries(TRACKS) as [keyof typeof TRACKS, { label: string; src: string }][]).map(([k, t]) => (
                  <option key={k} value={k}>{t.label}</option>
                ))}
              </select>
            </Box>
          )}
        </VStack>

        {/* ── Exit ── */}
        <Button
          mt={6} variant="ghost" size="sm"
          color="gray.300"
          _hover={{ color: "gray.600", bg: "transparent" }}
          onClick={onExit}
        >
          <X size={14} style={{ marginRight: "5px" }} /> Exit Focus
        </Button>
      </Box>
    </Box>
  );
};

export default PomodoroTimer;
