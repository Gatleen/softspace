import {
  Box,
  Button,
  Textarea,
  VStack,
  HStack,
  Text,
  IconButton,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import { useState } from "react";
import { X, Plus } from "lucide-react";

const PALETTES = [
  { bg: "#fce4ec", dot: "#f48fb1", label: "Rose"     },
  { bg: "#f3e5f5", dot: "#ce93d8", label: "Lavender" },
  { bg: "#e3f2fd", dot: "#90caf9", label: "Sky"      },
  { bg: "#e8f5e9", dot: "#a5d6a7", label: "Mint"     },
  { bg: "#fffde7", dot: "#fff176", label: "Lemon"    },
  { bg: "#fff3e0", dot: "#ffcc80", label: "Peach"    },
];

const EMOJIS = ["✨", "🌸", "🍵", "💖", "🎀", "🌙", "⭐", "🍓"];

interface Note {
  id: number;
  text: string;
  bgColor: string;
  textColor: string;
}

interface Props {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

// Resolve Chakra token bg to hex for notes created before this redesign
const resolveColor = (color: string) => {
  const MAP: Record<string, string> = {
    "pink.100": "#fce4ec", "purple.100": "#f3e5f5",
    "blue.100": "#e3f2fd", "green.100": "#e8f5e9",
    "yellow.100": "#fffde7", "orange.100": "#fff3e0",
  };
  return MAP[color] ?? color;
};

const StickyNotes = ({ notes, setNotes }: Props) => {
  const [newNote, setNewNote]       = useState("");
  const [selectedBg, setSelectedBg] = useState(PALETTES[0].bg);

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes([
      { id: Date.now(), text: newNote, bgColor: selectedBg, textColor: "gray.800" },
      ...notes,
    ]);
    setNewNote("");
  };

  const deleteNote = (id: number) => setNotes(notes.filter((n) => n.id !== id));

  const activePalette = PALETTES.find((p) => p.bg === selectedBg) ?? PALETTES[0];

  return (
    <Box
      bg="white"
      borderRadius="3xl"
      border="1.5px solid"
      borderColor="pink.100"
      boxShadow="0 8px 32px rgba(255,182,193,0.15)"
      overflow="hidden"
    >
      {/* ── Header ── */}
      <Box
        bg="linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)"
        px={6} pt={5} pb={5}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-16px" right="-16px" w="80px" h="80px"
          borderRadius="full" bg="whiteAlpha.100" />
        <Box position="absolute" bottom="-20px" left="30px" w="56px" h="56px"
          borderRadius="full" bg="whiteAlpha.100" />

        <HStack gap={3} position="relative">
          <Box
            w="42px" h="42px" borderRadius="xl"
            bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
            display="flex" alignItems="center" justifyContent="center"
            flexShrink={0}
          >
            <Image src="/icons/StickyNote.png" alt="Notes" boxSize="24px" objectFit="contain" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="lg" fontWeight="900" color="white" lineHeight="1">
              Sticky Notes
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800" fontWeight="bold">
              {notes.length} {notes.length === 1 ? "note" : "notes"} pinned
            </Text>
          </VStack>
        </HStack>
      </Box>

      <Box px={5} pt={4} pb={5}>
        {/* ── Compose area ── */}
        <Box
          bg={selectedBg}
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="0 4px 16px rgba(0,0,0,0.08)"
          mb={4}
          position="relative"
        >
          {/* Top strip — slightly darker */}
          <Box
            h="8px"
            style={{ background: activePalette.dot }}
            opacity={0.6}
          />

          {/* Pin dot */}
          <Box
            position="absolute" top="14px" left="50%" transform="translateX(-50%)"
            w="10px" h="10px" borderRadius="full"
            bg={activePalette.dot}
            boxShadow="0 1px 4px rgba(0,0,0,0.2)"
            zIndex={1}
          />

          <Box px={4} pt={5} pb={3}>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write something cute..."
              bg="transparent"
              border="none"
              borderRadius="none"
              resize="none"
              rows={3}
              fontSize="sm"
              color="gray.700"
              _placeholder={{ color: "blackAlpha.400" }}
              _focus={{ outline: "none", boxShadow: "none" }}
              p={0}
            />

            {/* Fold corner */}
            <Box
              position="absolute" bottom={0} right={0}
              w={0} h={0}
              style={{
                borderStyle: "solid",
                borderWidth: "0 0 22px 22px",
                borderColor: `transparent transparent ${activePalette.dot}88 transparent`,
              }}
            />

            <HStack justify="space-between" mt={2}>
              {/* Emoji shortcuts */}
              <HStack gap={0}>
                {EMOJIS.slice(0, 6).map((e) => (
                  <Box
                    key={e}
                    as="button"
                    px={1}
                    py="2px"
                    fontSize="md"
                    borderRadius="md"
                    cursor="pointer"
                    transition="transform 0.1s"
                    _hover={{ transform: "scale(1.3)" }}
                    onClick={() => setNewNote((p) => p + e)}
                  >
                    {e}
                  </Box>
                ))}
              </HStack>

              <Button
                size="sm"
                borderRadius="xl"
                bg={activePalette.dot}
                color="white"
                fontWeight="800"
                boxShadow="0 2px 8px rgba(0,0,0,0.15)"
                _hover={{ opacity: 0.85 }}
                onClick={addNote}
                gap={1}
              >
                <Plus size={14} /> Pin
              </Button>
            </HStack>
          </Box>
        </Box>

        {/* ── Colour picker ── */}
        <HStack gap={2} mb={4} justify="center">
          {PALETTES.map((p) => (
            <Box
              key={p.bg}
              as="button"
              w="22px" h="22px"
              borderRadius="full"
              bg={p.bg}
              border="2.5px solid"
              borderColor={selectedBg === p.bg ? p.dot : "transparent"}
              boxShadow={selectedBg === p.bg ? `0 0 0 2px ${p.dot}55` : "none"}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ transform: "scale(1.25)" }}
              onClick={() => setSelectedBg(p.bg)}
            />
          ))}
        </HStack>

        {/* ── Notes grid ── */}
        {notes.length === 0 ? (
          <Box
            py={6} textAlign="center"
            borderRadius="2xl" border="1.5px dashed"
            borderColor="pink.100"
          >
            <Text fontSize="xl" mb={1}>📌</Text>
            <Text fontSize="sm" color="gray.400" fontWeight="bold">
              No notes yet — pin one above!
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={2} gap={3}>
            {notes.map((note) => {
              const bg = resolveColor(note.bgColor);
              const palette = PALETTES.find((p) => p.bg === bg) ?? PALETTES[0];
              return (
                <Box
                  key={note.id}
                  bg={bg}
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="0 4px 12px rgba(0,0,0,0.07)"
                  position="relative"
                  transition="transform 0.2s"
                  _hover={{ transform: "rotate(1.5deg) translateY(-2px)" }}
                  className="group"
                >
                  {/* Top colour strip */}
                  <Box h="6px" style={{ background: palette.dot }} opacity={0.7} />

                  {/* Pin */}
                  <Box
                    position="absolute" top="10px" left="50%"
                    transform="translateX(-50%)"
                    w="8px" h="8px" borderRadius="full"
                    bg={palette.dot}
                    boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                    zIndex={1}
                  />

                  {/* Fold corner */}
                  <Box
                    position="absolute" bottom={0} right={0}
                    w={0} h={0}
                    style={{
                      borderStyle: "solid",
                      borderWidth: "0 0 18px 18px",
                      borderColor: `transparent transparent ${palette.dot}77 transparent`,
                    }}
                  />

                  <Box px={3} pt={5} pb={4}>
                    <Text
                      fontSize="xs"
                      color="gray.700"
                      whiteSpace="pre-wrap"
                      lineHeight="1.6"
                      fontWeight="600"
                    >
                      {note.text}
                    </Text>
                  </Box>

                  <IconButton
                    aria-label="Delete"
                    size="xs"
                    variant="ghost"
                    position="absolute"
                    top="6px"
                    right="4px"
                    opacity={0}
                    _groupHover={{ opacity: 1 }}
                    onClick={() => deleteNote(note.id)}
                    color="gray.500"
                    _hover={{ bg: "whiteAlpha.700", color: "red.400" }}
                    minW="auto"
                    h="auto"
                    p={1}
                  >
                    <X size={11} />
                  </IconButton>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default StickyNotes;