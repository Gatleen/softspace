import { useEffect, useRef, useState } from "react";
import { Box, Text, VStack, Center, Image, HStack, Circle, Input } from "@chakra-ui/react";
import { Upload } from "lucide-react";
import { fetchCustomPlaylists, addPlaylist, type Playlist } from "../lib/playlists";
import { recordPlaylistAdded } from "../lib/achievements";

const PLAYLIST_DATA: Playlist[] = [
  {
    id: "lofi",
    name: "Go Gatleen!",
    embedUrl: "https://open.spotify.com/embed/playlist/2klSJisbPa74QBCgz9hu9X?utm_source=generator",
    image: "/GoGatleen!.png",
    color: "#B2E2F2",
  },
];

const EMPTY_FORM = { name: "", spotifyUrl: "", imageDataUrl: "" };

const MusicPlayer = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLIST_DATA);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pull in any playlists added from the hosted app (Supabase-backed) and
  // extend the same rotation the built-in ones already live in.
  useEffect(() => {
    fetchCustomPlaylists().then((custom) => {
      if (custom.length) setPlaylists((prev) => [...prev, ...custom]);
    });
  }, []);

  const currentTrack = playlists[currentIdx];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAddPlaylist = async () => {
    if (!form.name.trim() || !form.spotifyUrl.trim() || !form.imageDataUrl) {
      setFormError("Fill in a name, a Spotify link, and a cover image.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const playlist = await addPlaylist(
        { name: form.name.trim(), spotifyUrl: form.spotifyUrl.trim(), imageDataUrl: form.imageDataUrl },
        playlists.length
      );
      setPlaylists((prev) => [...prev, playlist]);
      setCurrentIdx(playlists.length);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      recordPlaylistAdded();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save that playlist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="24px"
      border="2.5px solid"
      borderColor="#EEDCFB"
      boxShadow="0 6px 0 rgba(205,180,246,.35)"
      overflow="hidden"
    >
      {/* ── Gradient header ── */}
      <Box
        background="linear-gradient(135deg,#FFC2DA,#D9BFF7)"
        px={5} pt={4} pb={4}
        position="relative"
        overflow="hidden"
      >
        <HStack justify="space-between" position="relative">
          <HStack gap={3}>
            <Box
              w="42px" h="42px" borderRadius="14px"
              bg="rgba(255,255,255,.35)"
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              <Image src="/icons/CD.png" alt="CD" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontFamily="'Jersey 25', cursive" fontSize="24px" color="white" letterSpacing=".6px" textShadow="0 2px 0 rgba(196,87,127,.3)" lineHeight="1.1">
                Now Vibe-ing
              </Text>
              <Text fontSize="10.5px" color="rgba(255,255,255,.9)" fontWeight="700">
                {currentTrack.name}
              </Text>
            </VStack>
          </HStack>
          <Text fontSize="16px" color="white">♡</Text>
        </HStack>
      </Box>

      {/* ── Vinyl + controls ── */}
      <Box px={6} py={5}>
        <VStack gap={5}>
          {/* Vinyl record — a single "reference" box sized responsively to the card;
              everything inside (glow/disc/label/spindle/tonearm) is a % of it, so the
              whole assembly scales together instead of sitting at one fixed px size. */}
          <Center position="relative" w="100%" py={2}>
            <Box position="relative" w="min(72%, 240px)" aspectRatio="1">
              {/* Glow */}
              <Box
                position="absolute" inset="-8%" borderRadius="full"
                style={{ background: `radial-gradient(circle, ${currentTrack.color}88 0%, transparent 70%)` }}
                filter="blur(18px)"
              />

              {/* Disc */}
              <Box
                position="absolute" inset="0" borderRadius="full"
                style={{
                  animation: "vinyl-spin 4s linear infinite",
                  background: `repeating-radial-gradient(
                    circle at center,
                    #1c1c1c 0px,  #1c1c1c 6px,
                    #2a2a2a 6px,  #2a2a2a 7px,
                    #1c1c1c 7px,  #1c1c1c 14px,
                    #252525 14px, #252525 15px
                  )`,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.05)",
                }}
              >
                {/* Shine */}
                <Box position="absolute" inset="0" borderRadius="full" style={{
                  background: "conic-gradient(from 120deg, rgba(255,255,255,0.06) 0deg, transparent 60deg, rgba(255,255,255,0.03) 180deg, transparent 240deg)",
                }} />

                {/* Centre label */}
                <Box
                  position="absolute" w="41%" h="41%" borderRadius="full"
                  top="50%" left="50%" style={{ transform: "translate(-50%, -50%)" }}
                  overflow="hidden" border="3px solid #111"
                  boxShadow="0 0 0 2px rgba(255,255,255,0.1)" zIndex={2}
                >
                  <Image src={currentTrack.image} alt="Cover" w="full" h="full" objectFit="cover" />
                </Box>

                {/* Spindle */}
                <Box
                  position="absolute" w="5.7%" h="5.7%" borderRadius="full"
                  bg="#0d0d0d" top="50%" left="50%"
                  style={{ transform: "translate(-50%, -50%)" }}
                  border="1px solid rgba(255,255,255,0.12)" zIndex={3}
                />
              </Box>

              {/* Tonearm */}
              <Box
                position="absolute" top="4.8%" right="5.7%"
                w="2.9%" h="38%"
                bg="linear-gradient(to bottom, #d4a0ff, #9b59b6)"
                borderRadius="full" boxShadow="0 2px 6px rgba(0,0,0,0.4)"
                style={{ transformOrigin: "top center", transform: "rotate(28deg)" }}
                zIndex={4}
              >
                <Box position="absolute" bottom="-6px" left="50%"
                  style={{ transform: "translateX(-50%)" }}
                  w="4px" h="8px" bg="#c084fc" borderRadius="full" />
              </Box>
            </Box>
          </Center>

          {/* Playlist dots */}
          <HStack gap={2} flexWrap="wrap" justify="center">
            {playlists.map((_, index) => (
              <Circle
                key={index}
                size={currentIdx === index ? "13px" : "9px"}
                bg={currentIdx === index ? "#B98BE8" : "#EEDCFB"}
                cursor="pointer"
                onClick={() => setCurrentIdx(index)}
                transition="all 0.2s"
                _hover={{ transform: "scale(1.2)" }}
              />
            ))}
          </HStack>

          {/* Hint */}
          <Text fontSize="11px" color="#C2AECF" fontWeight="700">
            Log in to Spotify for full songs ✧
          </Text>

          {/* Spotify embed */}
          <Box
            w="full" h="80px" borderRadius="2xl" overflow="hidden"
            border="1.5px solid" borderColor="purple.50"
            boxShadow="0 2px 8px rgba(109,40,217,0.08)"
          >
            <iframe
              src={currentTrack.embedUrl}
              width="100%" height="80"
              style={{ border: "none" }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Embed"
            />
          </Box>

          {/* Add Playlist */}
          {!showAddForm ? (
            <Box
              as="button"
              onClick={() => setShowAddForm(true)}
              w="full"
              py="9px"
              borderRadius="14px"
              border="2px dashed #E1BEE7"
              fontSize="12px"
              fontWeight="800"
              color="#8A6BD1"
              cursor="pointer"
              _hover={{ bg: "#F6F0FF" }}
            >
              + Add Playlist
            </Box>
          ) : (
            <Box
              w="full"
              p={3}
              borderRadius="2xl"
              border="1.5px solid"
              borderColor="#EEDCFB"
              bg="linear-gradient(135deg, #faf5ff, #fdf2f8)"
            >
              <HStack mb={2} gap={2}>
                <Box w="3px" h="14px" borderRadius="full" bg="linear-gradient(to bottom, #c084fc, #f472b6)" />
                <Text fontSize="xs" fontWeight="800" color="purple.500" textTransform="uppercase" letterSpacing="wider">
                  Add Playlist
                </Text>
              </HStack>
              <VStack gap={2} align="stretch">
                <Input
                  placeholder="Playlist name"
                  size="sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  bg="white"
                  borderRadius="lg"
                  border="1.5px solid"
                  borderColor="purple.100"
                />
                <Input
                  placeholder="Spotify playlist link"
                  size="sm"
                  value={form.spotifyUrl}
                  onChange={(e) => setForm((f) => ({ ...f, spotifyUrl: e.target.value }))}
                  bg="white"
                  borderRadius="lg"
                  border="1.5px solid"
                  borderColor="purple.100"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <HStack
                  as="button"
                  onClick={() => fileInputRef.current?.click()}
                  justify="center"
                  gap={2}
                  py="7px"
                  borderRadius="lg"
                  border="1.5px dashed"
                  borderColor="purple.200"
                  fontSize="xs"
                  fontWeight="700"
                  color="purple.500"
                  bg="white"
                  cursor="pointer"
                >
                  <Upload size={13} />
                  <Text>{form.imageDataUrl ? "Cover selected ✓" : "Upload cover image"}</Text>
                </HStack>

                {formError && (
                  <Text fontSize="11px" color="#E11D48" fontWeight="700">
                    {formError}
                  </Text>
                )}

                <HStack gap={2}>
                  <Box
                    as="button"
                    flex={1}
                    onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); setFormError(""); }}
                    py="8px"
                    borderRadius="lg"
                    bg="gray.50"
                    color="gray.500"
                    fontSize="xs"
                    fontWeight="800"
                    cursor="pointer"
                  >
                    Cancel
                  </Box>
                  <Box
                    as="button"
                    flex={2}
                    onClick={handleAddPlaylist}
                    py="8px"
                    borderRadius="lg"
                    style={{ background: "linear-gradient(135deg, #f472b6, #c084fc)" }}
                    color="white"
                    fontSize="xs"
                    fontWeight="800"
                    cursor={submitting ? "default" : "pointer"}
                    opacity={submitting ? 0.7 : 1}
                  >
                    {submitting ? "Saving..." : "Save Playlist 🎀"}
                  </Box>
                </HStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>

      <style>{`
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default MusicPlayer;
