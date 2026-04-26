import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Image,
  IconButton,
  SimpleGrid,
  Drawer,
} from "@chakra-ui/react";
import {
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  Sticker,
  ArrowLeft,
  Save,
  Check,
} from "lucide-react";
import stickerPacks from "../data/stickerPacks.json";

// 🏗️ Data Structure
interface Attachment {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
}

interface NoteEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  attachments: Attachment[];
}

const Notebook = () => {
  const [entries, setEntries] = useState<NoteEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 🖱️ Interaction State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const paperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🎨 Sticker Drawer State
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("softspace_notebook");
    if (saved) {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map((e: NoteEntry) => ({
        ...e,
        attachments: e.attachments.map((a) => ({
          ...a,
          width: a.width || 120,
        })),
      }));
      setEntries(migrated);
      if (migrated.length > 0) setSelectedId(migrated[0].id);
    } else {
      const initial = [
        {
          id: Date.now(),
          title: "My First Entry",
          content: "Welcome to your digital sanctuary... 🌸",
          date: new Date().toLocaleDateString(),
          attachments: [],
        },
      ];
      setEntries(initial);
      setSelectedId(initial[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("softspace_notebook", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingId(null);
      setResizingId(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!paperRef.current) return;
      const paperRect = paperRef.current.getBoundingClientRect();

      if (draggingId) {
        const newX = e.clientX - paperRect.left - dragOffset.x;
        const newY = e.clientY - paperRect.top - dragOffset.y;
        updateAttachmentPosition(draggingId, newX, newY);
      }

      if (resizingId && selectedId) {
        const activeEntry = entries.find((e) => e.id === selectedId);
        const att = activeEntry?.attachments.find((a) => a.id === resizingId);
        if (att) {
          const newWidth = Math.max(50, e.clientX - paperRect.left - att.x);
          updateAttachmentSize(resizingId, newWidth);
        }
      }
    };

    if (draggingId || resizingId) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [draggingId, resizingId, dragOffset, entries, selectedId]);

  const activeEntry = entries.find((e) => e.id === selectedId);

  const updateAttachmentPosition = (attachId: string, x: number, y: number) => {
    if (!selectedId) return;
    setEntries((prev) =>
      prev.map((ent) =>
        ent.id === selectedId
          ? {
              ...ent,
              attachments: ent.attachments.map((att) =>
                att.id === attachId ? { ...att, x, y } : att,
              ),
            }
          : ent,
      ),
    );
  };

  const updateAttachmentSize = (attachId: string, width: number) => {
    if (!selectedId) return;
    setEntries((prev) =>
      prev.map((ent) =>
        ent.id === selectedId
          ? {
              ...ent,
              attachments: ent.attachments.map((att) =>
                att.id === attachId ? { ...att, width } : att,
              ),
            }
          : ent,
      ),
    );
  };

  const addAttachment = (src: string) => {
    if (!activeEntry) return;
    const newAtt: Attachment = {
      id: crypto.randomUUID(),
      src,
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      width: 150,
      rotation: Math.random() * 10 - 5,
    };
    updateEntry("attachments", [...activeEntry.attachments, newAtt]);
    setIsStickerDrawerOpen(false);
  };

  const handleDragStart = (e: React.MouseEvent, att: Attachment) => {
    e.preventDefault();
    if (paperRef.current) {
      const paperRect = paperRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - paperRect.left - att.x,
        y: e.clientY - paperRect.top - att.y,
      });
      setDraggingId(att.id);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, attId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingId(attId);
  };

  const handleManualSave = () => {
    localStorage.setItem("softspace_notebook", JSON.stringify(entries));
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const addEntry = () => {
    const newEntry: NoteEntry = {
      id: Date.now(),
      title: "",
      content: "",
      date: new Date().toLocaleDateString(),
      attachments: [],
    };
    setEntries([newEntry, ...entries]);
    setSelectedId(newEntry.id);
  };

  const updateEntry = (field: keyof NoteEntry, value: any) => {
    if (!selectedId) return;
    setEntries(
      entries.map((ent) =>
        ent.id === selectedId ? { ...ent, [field]: value } : ent,
      ),
    );
  };

  const deleteEntry = (id: number) => {
    const newEntries = entries.filter((ent) => ent.id !== id);
    setEntries(newEntries);
    if (selectedId === id)
      setSelectedId(newEntries.length > 0 ? newEntries[0].id : null);
  };

  const removeAttachment = (attId: string) => {
    if (activeEntry) {
      updateEntry(
        "attachments",
        activeEntry.attachments.filter((a) => a.id !== attId),
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => addAttachment(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box
      w="100%"
      h="calc(100vh - 40px)" // Adjust based on your layout padding
      maxW="1400px"
      mx="auto"
      display="flex"
      borderRadius="3xl"
      overflow="hidden"
      boxShadow="2xl"
      position="relative"
      bg="white"
    >
      {/* 1️⃣ LEFT SPINE */}
      <Box
        w="60px"
        bgGradient="linear(to-b, pink.500, purple.600)"
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
        py={8}
        gap={8}
        borderRight="5px solid rgba(0,0,0,0.2)"
        flexShrink={0}
      >
        {[...Array(8)].map((_, i) => (
          <Box key={i} w="100%" h="20px" position="relative">
            <Box
              position="absolute"
              left="8px"
              w="50px"
              h="14px"
              bg="gray.300"
              borderRadius="full"
              boxShadow="inset 2px 2px 5px rgba(0,0,0,0.3)"
              zIndex={2}
            />
          </Box>
        ))}
      </Box>

      {/* 2️⃣ PAPER AREA */}
      <Box
        flex={1}
        bg="#fffcf5"
        display="flex"
        flexDirection="column"
        position="relative"
      >
        {activeEntry ? (
          <>
            {/* 🛠️ TOOLBAR */}
            <HStack
              p={4}
              borderBottom="2px dashed"
              borderColor="pink.200"
              justify="space-between"
              bg="whiteAlpha.500"
            >
              <VStack align="start" gap={0} flex={1}>
                <Input
                  //variant="unstyled"
                  fontSize="3xl"
                  fontWeight="black"
                  color="gray.800"
                  placeholder="Untitled Story..."
                  value={activeEntry.title}
                  onChange={(e) => updateEntry("title", e.target.value)}
                  px={2}
                />
                <Text fontSize="sm" color="gray.500" px={2} fontWeight="medium">
                  {activeEntry.date}
                </Text>
              </VStack>

              <HStack gap={3}>
                <Button
                  colorPalette={isSaving ? "green" : "gray"}
                  variant="surface"
                  onClick={handleManualSave}
                  minW="100px"
                >
                  {isSaving ? <Check size={18} /> : <Save size={18} />}
                  {isSaving ? "Saved!" : "Save"}
                </Button>

                <Button
                  colorPalette="purple"
                  variant="outline"
                  onClick={() => setIsStickerDrawerOpen(true)}
                >
                  <Sticker size={18} /> Stickers
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <IconButton
                  aria-label="Upload"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={20} />
                </IconButton>

                <IconButton
                  aria-label="Delete"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => deleteEntry(activeEntry.id)}
                >
                  <Trash2 size={20} />
                </IconButton>
                <Button colorPalette="purple" onClick={addEntry}>
                  <Plus /> New Page
                </Button>
              </HStack>
            </HStack>

            {/* 📝 CANVAS */}
            <Box
              ref={paperRef}
              flex={1}
              p={10}
              overflow="hidden"
              position="relative"
              bgImage="linear-gradient(#e1e1e1 1px, transparent 1px)"
              bgSize="100% 40px"
            >
              <Textarea
                //variant="unstyled"
                h="100%"
                w="100%"
                resize="none"
                fontSize="xl"
                lineHeight="40px"
                placeholder="Start writing..."
                value={activeEntry.content}
                onChange={(e) => updateEntry("content", e.target.value)}
                zIndex={1}
              />

              {activeEntry.attachments.map((att) => (
                <Box
                  key={att.id}
                  position="absolute"
                  left={`${att.x}px`}
                  top={`${att.y}px`}
                  width={`${att.width}px`}
                  transform={`rotate(${att.rotation}deg)`}
                  cursor={draggingId === att.id ? "grabbing" : "grab"}
                  zIndex={10}
                  onMouseDown={(e) => handleDragStart(e, att)}
                  className="group"
                >
                  <Image
                    src={att.src}
                    w="100%"
                    h="auto"
                    draggable={false}
                    pointerEvents="none"
                    filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))"
                  />
                  <IconButton
                    aria-label="Remove"
                    size="xs"
                    colorPalette="red"
                    rounded="full"
                    position="absolute"
                    top="-10px"
                    right="-10px"
                    opacity={0}
                    _groupHover={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(att.id);
                    }}
                  >
                    <X size={12} />
                  </IconButton>

                  <Box
                    position="absolute"
                    bottom="-6px"
                    right="-6px"
                    w="16px"
                    h="16px"
                    bg="purple.400"
                    borderRadius="full"
                    border="2px solid white"
                    cursor="nwse-resize"
                    opacity={0}
                    _groupHover={{ opacity: 1 }}
                    onMouseDown={(e) => handleResizeStart(e, att.id)}
                    zIndex={30}
                  />
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Button onClick={addEntry} colorPalette="purple" size="xl">
              Create First Page
            </Button>
          </Box>
        )}
      </Box>

      {/* 📑 RIGHT TABS */}
      <Box
        position="absolute"
        right="-45px"
        top="40px"
        display="flex"
        flexDirection="column"
        gap={3}
        zIndex={50}
      >
        {entries.map((ent) => (
          <Box
            key={ent.id}
            w="50px"
            h="60px"
            bg={selectedId === ent.id ? "pink.500" : "white"}
            border="1px solid"
            borderColor="gray.300"
            borderLeft="none"
            borderRightRadius="xl"
            cursor="pointer"
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={() => setSelectedId(ent.id)}
            boxShadow="-2px 2px 5px rgba(0,0,0,0.1)"
            transition="all 0.2s"
            _hover={{ transform: "translateX(5px)" }}
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              color={selectedId === ent.id ? "white" : "gray.500"}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              {new Date(ent.date).getDate()}
            </Text>
          </Box>
        ))}
      </Box>

      {/* 🎒 STICKER DRAWER */}
      <Drawer.Root
        open={isStickerDrawerOpen}
        onOpenChange={(e) => setIsStickerDrawerOpen(e.open)}
        placement="end"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content offset={4} borderRadius="2xl">
            <Drawer.Header bg="purple.50">
              <HStack>
                {selectedPackId && (
                  <IconButton
                    aria-label="Back"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPackId(null)}
                  >
                    <ArrowLeft size={18} />
                  </IconButton>
                )}
                <Drawer.Title fontSize="lg" fontWeight="bold">
                  {selectedPackId ? "Choose Sticker" : "Stickers"}
                </Drawer.Title>
              </HStack>
            </Drawer.Header>
            <Drawer.Body bg="gray.50" p={4}>
              {!selectedPackId ? (
                <SimpleGrid columns={1} gap={4}>
                  {stickerPacks.map((pack) => (
                    <Box
                      key={pack.id}
                      bg="white"
                      p={4}
                      borderRadius="xl"
                      cursor="pointer"
                      onClick={() => setSelectedPackId(pack.id)}
                      display="flex"
                      alignItems="center"
                      gap={4}
                    >
                      <Box bg="purple.100" p={3} borderRadius="lg">
                        <Sticker size={24} color="#6B46C1" />
                      </Box>
                      <Box>
                        <Text fontWeight="bold">{pack.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {pack.files.length} stickers
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={3} gap={3}>
                  {stickerPacks
                    .find((p) => p.id === selectedPackId)
                    ?.files.map((file, i) => (
                      <Box
                        key={i}
                        bg="white"
                        p={2}
                        borderRadius="lg"
                        cursor="pointer"
                        _hover={{ bg: "purple.50" }}
                        onClick={() =>
                          addAttachment(
                            `/stickers/${stickerPacks.find((p) => p.id === selectedPackId)?.folder}/${file}`,
                          )
                        }
                      >
                        <Image
                          src={`/stickers/${stickerPacks.find((p) => p.id === selectedPackId)?.folder}/${file}`}
                          w="100%"
                          draggable={false}
                        />
                      </Box>
                    ))}
                </SimpleGrid>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
};

export default Notebook;
