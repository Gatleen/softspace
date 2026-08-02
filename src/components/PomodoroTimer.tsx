import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Box, HStack, Text, VStack, Input, Image,
} from "@chakra-ui/react";
import { X, Volume2, VolumeX, Coffee, BookOpen, Zap } from "lucide-react";

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

// Emoji shown on the mode-switcher pills (design-only, doesn't touch MODES data)
const MODE_EMOJI: Record<TimerMode, string> = { focus: "📖", short: "☕", long: "⚡" };

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
  // UI-only: whether the immersive full-bleed scene view is showing (no timer/session
  // state lives here — it purely toggles which JSX is rendered).
  const [sceneFullscreen, setSceneFullscreen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const theme = THEMES[themeKey];
  const pct   = totalSecs > 0 ? timeLeft / totalSecs : 0;

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

  // ── Shared render bits (kept as small inline helpers so both the in-dashboard
  //    panel and the full-screen scene render identical, wired-up controls) ──

  const ModeSwitcher = () => (
    <HStack gap="10px">
      {(Object.keys(MODES) as TimerMode[]).map((m) => {
        const active = mode === m;
        const mins = m === "focus" ? focusMins : MODES[m].defaultMins;
        return (
          <Box
            key={m}
            as="button"
            onClick={() => switchMode(m)}
            px="18px" py="10px"
            borderRadius="999px"
            border={active ? "2.5px solid white" : "2px solid #FFDDEB"}
            style={{ background: active ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)" : "white" }}
            boxShadow={active ? "0 5px 0 rgba(196,87,127,.22)" : "none"}
            transition="transform 0.15s ease"
            _hover={{ transform: "translateY(-2px)" }}
          >
            <Text
              fontFamily="'Jersey 25', cursive"
              fontSize="16px"
              color={active ? "white" : "#F27DAB"}
              style={active ? { textShadow: "0 2px 0 rgba(196,87,127,.3)" } : undefined}
            >
              {MODE_EMOJI[m]} {MODES[m].label} · {mins}
            </Text>
          </Box>
        );
      })}
    </HStack>
  );

  const ControlButtons = ({ big = false }: { big?: boolean }) => (
    <HStack gap="12px">
      <Box
        as="button"
        onClick={() => { setRunning((r) => !r); requestNotifPerm(); }}
        px={big ? "30px" : "24px"} py={big ? "14px" : "12px"}
        borderRadius="999px"
        style={{ background: "linear-gradient(135deg,#FFC2DA,#CDB4F6)" }}
        border="2.5px solid white"
        boxShadow="0 5px 0 rgba(196,87,127,.22)"
        transition="transform 0.15s ease"
        _hover={{ transform: "translateY(-2px)" }}
      >
        <Text
          fontFamily="'Jersey 25', cursive"
          fontSize={big ? "20px" : "18px"}
          color="white"
          style={{ textShadow: "0 2px 0 rgba(196,87,127,.3)" }}
        >
          {running ? "❚❚ Pause" : "▶ Start"}
        </Text>
      </Box>
      <Box
        as="button"
        onClick={reset}
        px={big ? "30px" : "24px"} py={big ? "14px" : "12px"}
        borderRadius="999px"
        bg="white"
        border="2px solid #FFDDEB"
        transition="transform 0.15s ease"
        _hover={{ transform: "translateY(-2px)" }}
      >
        <Text fontFamily="'Jersey 25', cursive" fontSize={big ? "20px" : "18px"} color="#F27DAB">
          ↻ Reset
        </Text>
      </Box>
    </HStack>
  );

  const TimerDisplay = ({ timerSize = "80px" }: { timerSize?: string }) => (
    <>
      <Box
        w="170px" h="230px"
        borderRadius="20px"
        overflow="hidden"
        bg="#FFF6FA"
        border="3px dashed #FFC8DE"
        display="flex" alignItems="center" justifyContent="center"
      >
        <Hourglass pct={pct} running={running} />
      </Box>
      <Text
        fontFamily="'Jersey 25', cursive"
        fontSize={timerSize}
        lineHeight="1"
        color="#C0577E"
        letterSpacing="2px"
      >
        {fmt(timeLeft)}
      </Text>
      <Text fontSize="12.5px" fontWeight="800" letterSpacing="2px" color="#B79ACB" textTransform="uppercase">
        {MODES[mode].label} Session{sessions > 0 ? ` · ${sessions} done today` : ""}
      </Text>
      {mode === "focus" && (
        <HStack gap="8px">
          <Text fontSize="11px" fontWeight="700" color="#B79ACB">Minutes:</Text>
          <Input
            value={focusMins}
            onChange={(e) => onFocusMinsChange(e.target.value)}
            type="number"
            w="64px"
            size="sm"
            textAlign="center"
            borderRadius="999px"
            border="2px solid #FFDDEB"
            bg="white"
            _focus={{ borderColor: "#F27DAB", boxShadow: "0 0 0 2px rgba(242,125,171,.25)" }}
          />
        </HStack>
      )}
    </>
  );

  const NowPlayingChip = ({ compact = false }: { compact?: boolean }) => (
    <HStack
      bg="rgba(255,255,255,.85)"
      border="2.5px solid white"
      borderRadius="999px"
      px={compact ? "14px" : "16px"}
      py={compact ? "8px" : "10px"}
      gap="8px"
    >
      <Image
        src="/icons/CD.png"
        alt="CD"
        boxSize="20px"
        style={{ animation: musicOn && running ? "ss-spin 4s linear infinite" : "none" }}
      />
      <Text fontSize="11.5px" fontWeight="700" color="#5C4A63">
        {TRACKS[trackKey].label}
      </Text>
    </HStack>
  );

  // ── Full-screen immersive scene mode ──────────────────────────────────────
  if (sceneFullscreen) {
    return (
      <Box position="fixed" inset="0" zIndex={1000} overflow="hidden">
        <Image
          src={theme.image}
          alt={theme.name}
          position="absolute" inset="0"
          w="100%" h="100%"
          objectFit="cover"
        />
        <Box
          position="absolute" inset="0"
          style={{
            background:
              "linear-gradient(180deg,rgba(255,249,252,.55) 0%,rgba(255,233,241,.25) 40%,rgba(122,90,160,.35) 100%)",
          }}
        />

        <Box position="relative" zIndex={1} h="100%" display="flex" flexDirection="column" justifyContent="space-between" p="30px">
          {/* Top row */}
          <HStack justify="space-between">
            <Box bg="rgba(255,255,255,.85)" border="2.5px solid white" borderRadius="999px" px="18px" py="10px">
              <Text fontFamily="'Jersey 25', cursive" fontSize="16px" color="#7A5AA6">
                {theme.name}
              </Text>
            </Box>
            <Box
              as="button"
              onClick={() => setSceneFullscreen(false)}
              bg="rgba(255,255,255,.85)" border="2.5px solid white" borderRadius="999px"
              px="18px" py="10px"
              transition="transform 0.15s ease"
              _hover={{ transform: "translateY(-2px)" }}
            >
              <Text fontFamily="'Jersey 25', cursive" fontSize="16px" color="#7A5AA6">
                ↙ Exit full screen
              </Text>
            </Box>
          </HStack>

          {/* Centered card */}
          <Box
            alignSelf="center"
            bg="rgba(255,255,255,.72)"
            border="3px solid white"
            borderRadius="34px"
            padding="34px 46px"
            boxShadow="0 12px 40px rgba(122,90,160,.25)"
            display="flex" flexDirection="column" alignItems="center" gap="16px"
          >
            {TimerDisplay({ timerSize: "104px" })}
            {ControlButtons({ big: true })}
          </Box>

          {/* Bottom row */}
          <HStack justify="space-between" align="flex-end">
            {NowPlayingChip({ compact: true })}
            <HStack gap="8px">
              {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
                <Box
                  key={k}
                  as="button"
                  onClick={() => setThemeKey(k)}
                  w="52px" h="52px"
                  borderRadius="12px"
                  overflow="hidden"
                  border={themeKey === k ? "2.5px solid #F27DAB" : "2.5px solid white"}
                  transition="transform 0.15s ease"
                  _hover={{ transform: "translateY(-2px)" }}
                >
                  <Image src={THEMES[k].image} alt={THEMES[k].name} w="100%" h="100%" objectFit="cover" />
                </Box>
              ))}
            </HStack>
          </HStack>
        </Box>
      </Box>
    );
  }

  // ── In-dashboard Focus panel ───────────────────────────────────────────────
  return (
    <Box
      borderRadius="26px"
      overflow="hidden"
      border="3px solid #EEDCFB"
      style={{ background: "linear-gradient(160deg,#F4EEFF,#FDF2F8 60%,#F1F8FE)" }}
      position="relative"
    >
      {/* Top row */}
      <HStack justify="space-between" padding="30px 34px">
        {ModeSwitcher()}
        <Box
          as="button"
          onClick={onExit}
          w="40px" h="40px"
          borderRadius="full"
          bg="white"
          border="2px solid #FFDDEB"
          color="#F27DAB"
          display="flex" alignItems="center" justifyContent="center"
          transition="transform 0.15s ease"
          _hover={{ transform: "scale(1.08)" }}
        >
          <X size={18} />
        </Box>
      </HStack>

      {/* Body */}
      <HStack align="stretch" gap="26px" px="34px" pb="34px">
        {/* Left: hourglass + timer */}
        <Box
          flex="1"
          bg="rgba(255,255,255,.75)"
          border="2.5px solid white"
          borderRadius="24px"
          padding="30px"
          boxShadow="0 6px 0 rgba(205,180,246,.25)"
          display="flex" flexDirection="column" alignItems="center" gap="14px"
        >
          {TimerDisplay({ timerSize: "80px" })}
          {ControlButtons({})}
        </Box>

        {/* Right: scene + ambient sound + mascot */}
        <VStack w="400px" flexShrink={0} gap="18px" align="stretch">
          {/* SCENE card */}
          <Box
            bg="rgba(255,255,255,.85)"
            border="2.5px solid white"
            borderRadius="24px"
            padding="20px"
            boxShadow="0 6px 0 rgba(205,180,246,.25)"
          >
            <HStack justify="space-between" mb="12px">
              <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#8A6BD1">
                SCENE
              </Text>
              <Text fontSize="10.5px" fontWeight="700" color="#C2AECF">
                tap to go full-screen
              </Text>
            </HStack>
            <Box display="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }} gap="10px">
              {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => {
                const t = THEMES[k];
                const active = themeKey === k;
                return (
                  <Box
                    key={k}
                    as="button"
                    onClick={() => { setThemeKey(k); setSceneFullscreen(true); }}
                    borderRadius="16px"
                    overflow="hidden"
                    border={active ? "2.5px solid #F27DAB" : "2.5px solid #FFE9F1"}
                    bg="white"
                    textAlign="left"
                    transition="transform 0.15s ease"
                    _hover={{ transform: "translateY(-2px)" }}
                  >
                    <Image src={t.image} alt={t.name} h="84px" w="100%" objectFit="cover" />
                    <Box px="8px" py="6px">
                      <Text fontSize="10.5px" fontWeight="800" color="#5C4A63">
                        {t.name}
                      </Text>
                      <Text fontSize="9.5px" fontWeight="700" color={active ? "#F27DAB" : "#C2AECF"}>
                        {active ? "playing ♡" : "tap to enter"}
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* AMBIENT SOUND card */}
          <Box
            bg="rgba(255,255,255,.85)"
            border="2.5px solid white"
            borderRadius="24px"
            padding="20px"
            boxShadow="0 6px 0 rgba(205,180,246,.25)"
          >
            <HStack justify="space-between" mb="12px">
              <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#8A6BD1">
                AMBIENT SOUND
              </Text>
              <Box
                as="button"
                onClick={() => setMusicOn((m) => !m)}
                title={musicOn ? "Mute music" : "Play ambient music"}
                w="30px" h="30px"
                borderRadius="full"
                display="flex" alignItems="center" justifyContent="center"
                style={{ background: musicOn ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)" : "white" }}
                border={musicOn ? "2px solid white" : "2px solid #FFDDEB"}
                color={musicOn ? "white" : "#B79ACB"}
                transition="transform 0.15s ease"
                _hover={{ transform: "scale(1.08)" }}
              >
                {musicOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </Box>
            </HStack>

            <HStack wrap="wrap" gap="8px" mb="12px">
              {(Object.entries(TRACKS) as [keyof typeof TRACKS, { label: string; src: string }][]).map(([k, t]) => {
                const active = trackKey === k;
                return (
                  <Box
                    key={k}
                    as="button"
                    onClick={() => setTrackKey(k)}
                    px="12px" py="6px"
                    borderRadius="999px"
                    bg={active ? "#FFF0F6" : "#FFF9FC"}
                    border={active ? "2px solid #F27DAB" : "2px solid #FFE9F1"}
                    color={active ? "#F27DAB" : "#8A7690"}
                    fontSize="11px"
                    fontWeight="700"
                    transition="transform 0.15s ease"
                    _hover={{ transform: "translateY(-1px)" }}
                  >
                    {t.label}
                  </Box>
                );
              })}
            </HStack>

            <HStack bg="#FFF9FC" border="2px solid #FFE9F1" borderRadius="16px" padding="10px" gap="10px">
              <Image
                src="/icons/CD.png"
                alt="CD"
                boxSize="30px"
                style={{ animation: musicOn && running ? "ss-spin 4s linear infinite" : "none" }}
              />
              <VStack align="start" gap="0" flex="1">
                <Text fontSize="11.5px" fontWeight="800" color="#5C4A63">
                  {TRACKS[trackKey].label}
                </Text>
                <HStack gap="3px" mt="4px">
                  {[6, 11, 15, 9, 13, 7].map((h, i) => (
                    <Box key={i} w="3px" h={`${h}px`} borderRadius="2px" bg="#F9A8CB" />
                  ))}
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* Mascot + quote */}
          <HStack
            bg="rgba(255,255,255,.85)"
            border="2.5px solid white"
            borderRadius="24px"
            padding="16px"
            gap="12px"
            boxShadow="0 6px 0 rgba(205,180,246,.25)"
          >
            <Image
              src="/Llama1.png"
              alt=""
              boxSize="40px"
              objectFit="contain"
              style={{ imageRendering: "pixelated", animation: "ss-float 5s ease-in-out infinite" }}
            />
            <Text fontSize="12.5px" fontWeight="700" fontStyle="italic" color="#8A7690">
              "Every focused minute blooms into progress." ✧
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

export default PomodoroTimer;
