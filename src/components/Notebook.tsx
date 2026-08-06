import { useState, useEffect, useRef } from "react";
import { Box, Input, Textarea, Text, IconButton, Image } from "@chakra-ui/react";
import { Trash2, X, ArrowLeft } from "lucide-react";
import stickerPacks from "../data/stickerPacks.json";
import SoftSpaceCard from "./ui/SoftSpaceCard";
import SectionHeader from "./ui/SectionHeader";
import { recordJournalEntryCount } from "../lib/achievements";
import { supabase } from "../lib/supabase";

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
  id: string;
  title: string;
  content: string;
  createdAt: number;
  attachments: Attachment[];
}

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-MY", { weekday: "short", month: "short", day: "numeric" });

const Notebook = () => {
  const [entries, setEntries] = useState<NoteEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Debounced title/content autosave — captures the target entry id at edit
  // time (not re-read at fire time), flushed immediately on entry-switch,
  // manual save, or the tab being backgrounded/closed.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ id: string; updates: Partial<Pick<NoteEntry, "title" | "content">> } | null>(null);

  const flushPendingSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return;
    supabase.from("journal_entries").update(pending.updates).eq("id", pending.id)
      .then(({ error }) => { if (error) console.warn("save entry:", error); });
  };

  const scheduleTextSave = (entryId: string, field: "title" | "content", value: string) => {
    if (pendingSaveRef.current && pendingSaveRef.current.id !== entryId) flushPendingSave();
    pendingSaveRef.current = {
      id: entryId,
      updates: { ...pendingSaveRef.current?.updates, [field]: value },
    };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushPendingSave, 800);
  };

  const selectEntry = (id: string | null) => {
    flushPendingSave();
    setSelectedId(id);
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: entriesData, error: entriesError }, { data: attachmentsData, error: attachmentsError }] =
        await Promise.all([
          supabase.from("journal_entries").select("*").order("created_at", { ascending: false }),
          supabase.from("journal_attachments").select("*"),
        ]);
      if (cancelled) return;
      if (entriesError || !entriesData) {
        if (entriesError) console.warn("load journal_entries:", entriesError);
        return;
      }
      if (attachmentsError) console.warn("load journal_attachments:", attachmentsError);

      const attachmentsByEntry = new Map<string, Attachment[]>();
      (attachmentsData ?? []).forEach((a) => {
        const list = attachmentsByEntry.get(a.entry_id) ?? [];
        list.push({ id: a.id, src: a.src, x: a.x, y: a.y, width: a.width, rotation: a.rotation });
        attachmentsByEntry.set(a.entry_id, list);
      });

      const loaded: NoteEntry[] = entriesData.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        createdAt: new Date(e.created_at).getTime(),
        attachments: attachmentsByEntry.get(e.id) ?? [],
      }));
      setEntries(loaded);
      if (loaded.length > 0) setSelectedId(loaded[0].id);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Persist the final position/size once, on drop — not on every mousemove
    // pixel (that would flood Supabase; local state during the drag itself
    // stays purely in-memory via updateAttachmentPosition/Size below).
    const handleGlobalMouseUp = () => {
      const entry = entries.find((e) => e.id === selectedId);
      if (draggingId) {
        const att = entry?.attachments.find((a) => a.id === draggingId);
        if (att) {
          supabase.from("journal_attachments").update({ x: att.x, y: att.y }).eq("id", att.id)
            .then(({ error }) => { if (error) console.warn("attachment move:", error); });
        }
      }
      if (resizingId) {
        const att = entry?.attachments.find((a) => a.id === resizingId);
        if (att) {
          supabase.from("journal_attachments").update({ width: att.width }).eq("id", att.id)
            .then(({ error }) => { if (error) console.warn("attachment resize:", error); });
        }
      }
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
    supabase.from("journal_attachments").insert({
      id: newAtt.id,
      entry_id: activeEntry.id,
      src: newAtt.src,
      x: newAtt.x,
      y: newAtt.y,
      width: newAtt.width,
      rotation: newAtt.rotation,
    }).then(({ error }) => { if (error) console.warn("addAttachment:", error); });
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
    flushPendingSave();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const addEntry = () => {
    const id = crypto.randomUUID();
    const newEntry: NoteEntry = {
      id,
      title: "",
      content: "",
      createdAt: Date.now(),
      attachments: [],
    };
    setEntries([newEntry, ...entries]);
    selectEntry(id);
    recordJournalEntryCount(entries.length + 1);
    supabase.from("journal_entries").insert({ id, title: "", content: "" })
      .then(({ error }) => { if (error) console.warn("addEntry:", error); });
  };

  const updateEntry = (field: keyof NoteEntry, value: any) => {
    if (!selectedId) return;
    setEntries(
      entries.map((ent) =>
        ent.id === selectedId ? { ...ent, [field]: value } : ent,
      ),
    );
  };

  const deleteEntry = (id: string) => {
    const newEntries = entries.filter((ent) => ent.id !== id);
    setEntries(newEntries);
    if (selectedId === id)
      selectEntry(newEntries.length > 0 ? newEntries[0].id : null);
    supabase.from("journal_entries").delete().eq("id", id)
      .then(({ error }) => { if (error) console.warn("deleteEntry:", error); });
  };

  const removeAttachment = (attId: string) => {
    if (activeEntry) {
      updateEntry(
        "attachments",
        activeEntry.attachments.filter((a) => a.id !== attId),
      );
      supabase.from("journal_attachments").delete().eq("id", attId)
        .then(({ error }) => { if (error) console.warn("removeAttachment:", error); });
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

  const pillBase = {
    borderRadius: "999px",
    fontFamily: "'Jersey 25', cursive",
    fontSize: "16px",
    cursor: "pointer",
    padding: "8px 18px",
  } as const;

  return (
    <Box w="100%">
      <SectionHeader
        title="My Journal"
        meta={`${entries.length} ${entries.length === 1 ? "entry" : "entries"} · saved to the cloud`}
      />

      <Box display="flex" gap="22px" alignItems="flex-start" flexWrap="wrap">
        {/* 1️⃣ LEFT SIDEBAR — Entries */}
        <Box w={{ base: "100%", lg: "300px" }} flexShrink={0}>
          <SoftSpaceCard icon="/icons/Notebook.png" title="Entries" subtitle="Newest first">
            <Box
              as="button"
              onClick={addEntry}
              w="100%"
              border="2px dashed #FFC8DE"
              borderRadius="14px"
              padding="11px 14px"
              textAlign="center"
              fontSize="12.5px"
              fontWeight="800"
              color="#F27DAB"
              bg="transparent"
              cursor="pointer"
              mb="12px"
            >
              + New Entry
            </Box>

            <Box display="flex" flexDirection="column" gap="10px">
              {entries.length === 0 && (
                <Text fontSize="11.5px" fontWeight="600" color="#C2AECF" textAlign="center">
                  No entries yet ✧
                </Text>
              )}
              {entries.map((ent) => {
                const isSelected = selectedId === ent.id;
                const preview = ent.content.trim()
                  ? ent.content.slice(0, 64) + (ent.content.length > 64 ? "…" : "")
                  : "No content yet...";
                return (
                  <Box
                    key={ent.id}
                    onClick={() => selectEntry(ent.id)}
                    cursor="pointer"
                    padding="13px 14px"
                    borderRadius="16px"
                    bg={isSelected ? "#FFF0F6" : "#FFF9FC"}
                    border="2px solid"
                    borderColor={isSelected ? "#F27DAB" : "#FFE9F1"}
                  >
                    <Box display="flex" alignItems="baseline" justifyContent="space-between" gap="8px">
                      <Text
                        fontSize="13.5px"
                        fontWeight="800"
                        color="#C0577E"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {ent.title || "Untitled"}
                      </Text>
                      <Text fontSize="10px" fontWeight="700" color="#C2AECF" flexShrink={0}>
                        {fmtDate(ent.createdAt)}
                      </Text>
                    </Box>
                    <Text
                      fontSize="11.5px"
                      fontWeight="600"
                      color="#A08B9B"
                      mt="4px"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {preview}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          </SoftSpaceCard>
        </Box>

        {/* 2️⃣ RIGHT MAIN PANEL */}
        <Box
          flex="1"
          minW="0"
          bg="white"
          border="2.5px solid #FFDDEB"
          borderRadius="24px"
          boxShadow="0 6px 0 rgba(255,199,222,.45)"
          overflow="hidden"
        >
          {activeEntry ? (
            <>
              {/* washi tape strip */}
              <Box
                h="12px"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg,#FFC2DA 0 18px,#FFF3D6 18px 36px)",
                }}
              />

              <Box padding="28px 34px 34px">
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap="12px">
                  <Input
                    value={activeEntry.title}
                    onChange={(e) => {
                      updateEntry("title", e.target.value);
                      scheduleTextSave(activeEntry.id, "title", e.target.value);
                    }}
                    placeholder="Untitled Story..."
                    fontFamily="'Jersey 25', cursive"
                    fontSize="40px"
                    color="#C0577E"
                    border="none"
                    outline="none"
                    p="0"
                    h="auto"
                    _focus={{ boxShadow: "none" }}
                    bg="transparent"
                  />
                  <IconButton
                    aria-label="Delete entry"
                    variant="ghost"
                    onClick={() => deleteEntry(activeEntry.id)}
                    color="#C2AECF"
                    _hover={{ color: "#F27DAB", bg: "#FFF0F6" }}
                    flexShrink={0}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Box>
                <Text fontSize="11.5px" fontWeight="700" color="#C2AECF">
                  {fmtDate(activeEntry.createdAt)}
                </Text>

                {/* 📝 CANVAS — lined paper, drag/resize logic untouched */}
                <Box
                  ref={paperRef}
                  position="relative"
                  overflow="hidden"
                  mt="18px"
                  padding="18px 20px"
                  borderRadius="16px"
                  border="2px solid #FFE9F1"
                  minH="260px"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(#FFFDFE 0 31px,#FFEDF4 31px 32px)",
                  }}
                >
                  <Textarea
                    h="100%"
                    minH="220px"
                    w="100%"
                    resize="none"
                    border="none"
                    outline="none"
                    fontSize="15px"
                    fontWeight="600"
                    lineHeight="32px"
                    color="#5C4A63"
                    bg="transparent"
                    p="0"
                    _focus={{ boxShadow: "none" }}
                    placeholder="Start writing..."
                    value={activeEntry.content}
                    onChange={(e) => {
                      updateEntry("content", e.target.value);
                      scheduleTextSave(activeEntry.id, "content", e.target.value);
                    }}
                    position="relative"
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
                        rounded="full"
                        position="absolute"
                        top="-10px"
                        right="-10px"
                        opacity={0}
                        bg="#F27DAB"
                        color="white"
                        _hover={{ bg: "#C0577E" }}
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
                        bg="#8A6BD1"
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

                {/* 🛠️ ACTION PILLS */}
                <Box display="flex" gap="12px" mt="18px" flexWrap="wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                  <Box
                    as="button"
                    onClick={() => fileInputRef.current?.click()}
                    {...pillBase}
                    background="#FFF0F6"
                    border="2px solid #FFDDEB"
                    color="#F27DAB"
                  >
                    ＋ Add photo
                  </Box>
                  <Box
                    as="button"
                    onClick={() => setIsStickerDrawerOpen((prev) => !prev)}
                    {...pillBase}
                    background="#F6F0FF"
                    border="2px solid #EEDCFB"
                    color="#8A6BD1"
                  >
                    ✧ Stickers
                  </Box>
                  <Box
                    as="button"
                    onClick={handleManualSave}
                    {...pillBase}
                    background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                    border="2.5px solid white"
                    boxShadow="0 5px 0 rgba(196,87,127,.22)"
                    color="white"
                  >
                    {isSaving ? "♡ Saved!" : "♡ Save entry"}
                  </Box>
                </Box>
              </Box>

              {/* 🎒 STICKER DRAWER — inline, pack ⇄ sticker navigation untouched */}
              {isStickerDrawerOpen && (
                <Box borderTop="3px dotted #FFD3E4" padding="16px 34px 22px">
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb="12px">
                    <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#C0577E">
                      {selectedPackId ? "CHOOSE STICKER" : "STICKER DRAWER"}
                    </Text>
                    {selectedPackId && (
                      <IconButton
                        aria-label="Back"
                        variant="ghost"
                        size="sm"
                        color="#C0577E"
                        onClick={() => setSelectedPackId(null)}
                      >
                        <ArrowLeft size={16} />
                      </IconButton>
                    )}
                  </Box>

                  {!selectedPackId ? (
                    <Box display="flex" flexWrap="wrap" gap="12px">
                      {stickerPacks.map((pack) => (
                        <Box
                          key={pack.id}
                          as="button"
                          onClick={() => setSelectedPackId(pack.id)}
                          w="96px"
                          padding="10px"
                          borderRadius="16px"
                          bg="#FFF9FC"
                          border="2px solid #FFE9F1"
                          textAlign="center"
                        >
                          <Image
                            src={`/stickers/${pack.folder}/${pack.files[0]}`}
                            boxSize="48px"
                            mx="auto"
                            objectFit="contain"
                            draggable={false}
                          />
                          <Text fontSize="10.5px" fontWeight="800" color="#A08B9B" mt="6px">
                            {pack.name}
                          </Text>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box display="flex" flexWrap="wrap" gap="12px">
                      {stickerPacks
                        .find((p) => p.id === selectedPackId)
                        ?.files.map((file, i) => {
                          const folder = stickerPacks.find((p) => p.id === selectedPackId)?.folder;
                          return (
                            <Box
                              key={i}
                              as="button"
                              onClick={() => addAttachment(`/stickers/${folder}/${file}`)}
                              w="96px"
                              padding="10px"
                              borderRadius="16px"
                              bg="#FFF9FC"
                              border="2px solid #FFE9F1"
                              textAlign="center"
                            >
                              <Image
                                src={`/stickers/${folder}/${file}`}
                                boxSize="48px"
                                mx="auto"
                                objectFit="contain"
                                draggable={false}
                              />
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Box padding="60px 34px" textAlign="center">
              <Box
                as="button"
                onClick={addEntry}
                {...pillBase}
                background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
                border="2.5px solid white"
                boxShadow="0 5px 0 rgba(196,87,127,.22)"
                color="white"
                fontSize="20px"
              >
                Create First Page
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Notebook;
