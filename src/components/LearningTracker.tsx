import { useState, useEffect } from "react";
import {
  Box, Button, Input, Textarea, VStack, HStack, Text, Badge, IconButton, SimpleGrid,
} from "@chakra-ui/react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, BookOpen, CheckCircle2,
  Lightbulb, Cog, ExternalLink, Clock, Award,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProjectStatus = "idea" | "in_progress" | "done";

interface Subtask {
  id: string;
  project_id: string;
  text: string;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  started_at: string | null;
  source_name: string;
  source_url: string;
  category: string;
  estimated_hours: number | null;
  hours_spent: number;
  certificate: boolean;
  subtasks?: Subtask[];
}

interface DailyLog {
  id: string;
  date: string;
  content: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; chakra: string; icon: React.ReactNode }> = {
  idea:        { label: "Upcoming",    color: "#A855F7", chakra: "purple", icon: <Lightbulb size={13} />    },
  in_progress: { label: "In Progress", color: "#F59E0B", chakra: "orange", icon: <Cog size={13} />         },
  done:        { label: "Done",        color: "#10B981", chakra: "green",  icon: <CheckCircle2 size={13} /> },
};

const STATUS_CYCLE: ProjectStatus[] = ["idea", "in_progress", "done"];

const CATEGORIES = ["Web Dev", "Design", "Data Science", "Mobile", "Languages", "Business", "Creative", "Other"];
const SOURCES    = ["Udemy", "Coursera", "YouTube", "freeCodeCamp", "edX", "LinkedIn Learning", "Book", "Blog", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  "Web Dev": "blue", Design: "pink", "Data Science": "purple", Mobile: "cyan",
  Languages: "orange", Business: "teal", Creative: "red", Other: "gray",
};

const emptyForm = {
  title: "", description: "", status: "idea" as ProjectStatus,
  started_at: new Date().toISOString().split("T")[0],
  source_name: "", source_url: "", category: "Other",
  estimated_hours: "", hours_spent: "0",
};

// ─── Component ────────────────────────────────────────────────────────────────
const LearningTracker = () => {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [logs, setLogs]           = useState<DailyLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [form, setForm]           = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm]   = useState(false);

  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [newSubtask, setNewSubtask] = useState<Record<string, string>>({});

  // Inline hours updater per project
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [hoursInput, setHoursInput]     = useState("");

  const [logText, setLogText]   = useState("");
  const [logDate, setLogDate]   = useState(new Date().toISOString().split("T")[0]);
  const [logError, setLogError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [projRes, subtaskRes, logRes] = await Promise.all([
      supabase.from("learning_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("learning_subtasks").select("*").order("created_at", { ascending: true }),
      supabase.from("daily_logs").select("*").order("date", { ascending: false }),
    ]);
    if (projRes.error) { setError(projRes.error.message); setLoading(false); return; }
    const subtasks: Subtask[] = subtaskRes.data || [];
    const projs: Project[] = (projRes.data || []).map((p) => ({
      ...p,
      subtasks: subtasks.filter((s) => s.project_id === p.id),
    }));
    setProjects(projs);
    setLogs(logRes.data || []);
    setLoading(false);
  };

  // ─── Project actions ────────────────────────────────────────────────────────
  const addProject = async () => {
    setFormError("");
    if (!form.title.trim()) { setFormError("Please enter a title."); return; }
    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim(),
      status:          form.status,
      started_at:      form.started_at || null,
      source_name:     form.source_name.trim(),
      source_url:      form.source_url.trim(),
      category:        form.category,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      hours_spent:     parseFloat(form.hours_spent) || 0,
      certificate:     false,
    };
    const { data, error } = await supabase.from("learning_projects").insert(payload).select().single();
    if (error) { setFormError(`Supabase error: ${error.message}`); return; }
    setProjects((prev) => [{ ...data, subtasks: [] }, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("learning_projects").delete().eq("id", id);
    if (!error) setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const cycleStatus = async (project: Project) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(project.status) + 1) % STATUS_CYCLE.length];
    const { error } = await supabase.from("learning_projects").update({ status: next }).eq("id", project.id);
    if (!error) setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: next } : p));
  };

  const toggleCertificate = async (project: Project) => {
    const { error } = await supabase.from("learning_projects")
      .update({ certificate: !project.certificate }).eq("id", project.id);
    if (!error) setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, certificate: !p.certificate } : p));
  };

  const saveHours = async (project: Project) => {
    const hrs = parseFloat(hoursInput);
    if (isNaN(hrs) || hrs < 0) return;
    const { error } = await supabase.from("learning_projects").update({ hours_spent: hrs }).eq("id", project.id);
    if (!error) {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, hours_spent: hrs } : p));
      setEditingHours(null);
    }
  };

  // ─── Subtask actions ────────────────────────────────────────────────────────
  const addSubtask = async (projectId: string) => {
    const text = (newSubtask[projectId] || "").trim();
    if (!text) return;
    const { data, error } = await supabase.from("learning_subtasks")
      .insert({ project_id: projectId, text, completed: false }).select().single();
    if (error || !data) return;
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, subtasks: [...(p.subtasks || []), data] } : p
    ));
    setNewSubtask((prev) => ({ ...prev, [projectId]: "" }));
  };

  const toggleSubtask = async (projectId: string, subtask: Subtask) => {
    const { error } = await supabase.from("learning_subtasks")
      .update({ completed: !subtask.completed }).eq("id", subtask.id);
    if (!error) {
      setProjects((prev) => prev.map((p) =>
        p.id === projectId
          ? { ...p, subtasks: p.subtasks?.map((s) => s.id === subtask.id ? { ...s, completed: !s.completed } : s) }
          : p
      ));
    }
  };

  const deleteSubtask = async (projectId: string, subtaskId: string) => {
    const { error } = await supabase.from("learning_subtasks").delete().eq("id", subtaskId);
    if (!error) setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, subtasks: p.subtasks?.filter((s) => s.id !== subtaskId) } : p
    ));
  };

  // ─── Daily log actions ──────────────────────────────────────────────────────
  const addLog = async () => {
    setLogError("");
    if (!logText.trim()) { setLogError("Write something you learned first!"); return; }
    const { data, error } = await supabase.from("daily_logs")
      .insert({ date: logDate, content: logText.trim() }).select().single();
    if (error) { setLogError(`Supabase error: ${error.message}`); return; }
    setLogs((prev) => [data, ...prev]);
    setLogText("");
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from("daily_logs").delete().eq("id", id);
    if (!error) setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box textAlign="center" py={20}>
      <Text color="pink.300" fontWeight="800" fontSize="lg">Loading... ✨</Text>
    </Box>
  );

  if (error) return (
    <Box p={6} bg="red.50" borderRadius="2xl" border="1px solid" borderColor="red.200">
      <Text color="red.500" fontWeight="700">⚠️ Supabase error: {error}</Text>
    </Box>
  );

  const byStatus = (s: ProjectStatus) => projects.filter((p) => p.status === s);

  return (
    <Box bg="linear-gradient(135deg, #fff0f6 0%, #f0f0ff 100%)" minH="100vh" p={8}>

      {/* Header */}
      <HStack mb={8} justify="space-between">
        <HStack gap={3}>
          <Box w="40px" h="40px" bg="purple.100" borderRadius="xl"
            display="flex" alignItems="center" justifyContent="center">
            <BookOpen size={22} color="#A855F7" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="2xl" fontWeight="900" color="purple.500">Learning & Projects</Text>
            <Text fontSize="xs" color="purple.300" fontWeight="bold">Track your growth, one step at a time ✨</Text>
          </VStack>
        </HStack>
        <Button colorPalette="purple" borderRadius="full" fontWeight="800"
          boxShadow="0 4px 12px rgba(168,85,247,0.3)"
          onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} style={{ marginRight: "6px" }} />
          {showForm ? "Cancel" : "New Course / Project"}
        </Button>
      </HStack>

      {/* Add project form — collapsible */}
      {showForm && (
        <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(168,85,247,0.12)"
          border="2px solid" borderColor="purple.100" mb={8}>
          <Text fontWeight="800" fontSize="lg" color="purple.500" mb={5}>New Course / Project 📚</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {/* Title */}
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">TITLE *</Text>
              <Input placeholder="e.g. React Complete Guide, UI/UX Bootcamp..."
                value={form.title} bg="purple.50" border="none" borderRadius="xl"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                _focus={{ boxShadow: "0 0 0 2px #d8b4fe" }} />
            </Box>
            {/* Description */}
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">DESCRIPTION</Text>
              <Input placeholder="What will you learn?"
                value={form.description} bg="purple.50" border="none" borderRadius="xl"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                _focus={{ boxShadow: "0 0 0 2px #d8b4fe" }} />
            </Box>
            {/* Source name */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">PLATFORM / SOURCE</Text>
              <select value={form.source_name}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "none",
                  background: "#faf5ff", fontSize: "14px", fontWeight: 600, color: "#374151", outline: "none" }}
                onChange={(e) => setForm({ ...form, source_name: e.target.value })}>
                <option value="">Select platform...</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Box>
            {/* Source URL */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">COURSE URL</Text>
              <Input placeholder="https://..."
                value={form.source_url} bg="purple.50" border="none" borderRadius="xl"
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                _focus={{ boxShadow: "0 0 0 2px #d8b4fe" }} />
            </Box>
            {/* Category */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={2} letterSpacing="wider">CATEGORY</Text>
              <HStack flexWrap="wrap" gap={2}>
                {CATEGORIES.map((cat) => (
                  <Badge key={cat} px={3} py={1} borderRadius="full" cursor="pointer" fontWeight="700" fontSize="xs"
                    colorPalette={form.category === cat ? CATEGORY_COLORS[cat] || "gray" : "gray"}
                    variant={form.category === cat ? "solid" : "outline"}
                    onClick={() => setForm({ ...form, category: cat })}>
                    {cat}
                  </Badge>
                ))}
              </HStack>
            </Box>
            {/* Status */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={2} letterSpacing="wider">STATUS</Text>
              <HStack gap={2}>
                {STATUS_CYCLE.map((s) => (
                  <Button key={s} size="sm" borderRadius="full"
                    variant={form.status === s ? "solid" : "outline"}
                    colorPalette={STATUS_CONFIG[s].chakra}
                    fontWeight="700" onClick={() => setForm({ ...form, status: s })}>
                    {STATUS_CONFIG[s].label}
                  </Button>
                ))}
              </HStack>
            </Box>
            {/* Started date */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">DATE STARTED</Text>
              <Input type="date" value={form.started_at} bg="purple.50" border="none" borderRadius="xl"
                onChange={(e) => setForm({ ...form, started_at: e.target.value })}
                _focus={{ boxShadow: "0 0 0 2px #d8b4fe" }} />
            </Box>
            {/* Estimated hours */}
            <Box>
              <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">ESTIMATED HOURS</Text>
              <Input type="number" placeholder="e.g. 20"
                value={form.estimated_hours} bg="purple.50" border="none" borderRadius="xl"
                onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                _focus={{ boxShadow: "0 0 0 2px #d8b4fe" }} />
            </Box>
          </SimpleGrid>

          {formError && (
            <Box mt={4} px={4} py={2.5} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.200">
              <Text fontSize="sm" color="red.500" fontWeight="700">⚠️ {formError}</Text>
            </Box>
          )}
          <Button mt={5} onClick={addProject} colorPalette="purple" borderRadius="full" fontWeight="800"
            boxShadow="0 4px 12px rgba(168,85,247,0.3)">
            <Plus size={16} style={{ marginRight: "6px" }} /> Add Course / Project
          </Button>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8} alignItems="start">

        {/* ── LEFT: Projects ── */}
        <VStack gap={6} align="stretch">
          {STATUS_CYCLE.map((status) => {
            const items = byStatus(status);
            if (items.length === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <Box key={status}>
                <HStack mb={3} gap={2}>
                  <Box w="8px" h="8px" borderRadius="full" style={{ background: cfg.color }} />
                  <Text fontSize="xs" fontWeight="800" color="gray.500" letterSpacing="wider">
                    {cfg.label.toUpperCase()} ({items.length})
                  </Text>
                </HStack>
                <VStack gap={3} align="stretch">
                  {items.map((project) => {
                    const subtasks   = project.subtasks || [];
                    const doneTasks  = subtasks.filter((s) => s.completed).length;
                    const isExpanded = expanded[project.id] ?? false;
                    const hrsPct     = project.estimated_hours
                      ? Math.min((project.hours_spent / project.estimated_hours) * 100, 100) : null;

                    return (
                      <Box key={project.id} bg="white" borderRadius="2xl"
                        boxShadow="0 4px 16px rgba(168,85,247,0.08)"
                        border="1.5px solid" borderColor={isExpanded ? "purple.200" : "gray.100"}
                        transition="all 0.2s" _hover={{ borderColor: "purple.200" }}>

                        {/* Card header */}
                        <HStack p={4} gap={3} align="start">
                          <IconButton aria-label="expand" size="xs" variant="ghost" borderRadius="lg" mt={0.5}
                            onClick={() => setExpanded((prev) => ({ ...prev, [project.id]: !isExpanded }))}>
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </IconButton>

                          <VStack align="start" gap={1} flex={1} minW={0}>
                            {/* Title row */}
                            <HStack gap={2} w="100%">
                              <Text fontWeight="800" fontSize="md" color="gray.800"
                                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {project.title}
                              </Text>
                              {project.certificate && (
                                <Badge colorPalette="yellow" variant="solid" borderRadius="full" fontSize="10px" px={2} flexShrink={0}>
                                  🏅 Certified
                                </Badge>
                              )}
                            </HStack>

                            {/* Meta row */}
                            <HStack gap={3} flexWrap="wrap">
                              {/* Category */}
                              <Badge colorPalette={CATEGORY_COLORS[project.category] || "gray"}
                                variant="subtle" borderRadius="full" fontSize="10px" fontWeight="700">
                                {project.category}
                              </Badge>

                              {/* Source */}
                              {project.source_name && (
                                project.source_url ? (
                                  <a
                                    href={project.source_url.startsWith("http") ? project.source_url : `https://${project.source_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <Text fontSize="xs" color="purple.400" fontWeight="700">{project.source_name}</Text>
                                    <ExternalLink size={11} color="#A855F7" />
                                  </a>
                                ) : (
                                  <Text fontSize="xs" color="gray.400" fontWeight="600">{project.source_name}</Text>
                                )
                              )}

                              {/* Started date */}
                              {project.started_at && (
                                <Text fontSize="xs" color="gray.400" fontWeight="600">
                                  Started {new Date(project.started_at + "T00:00:00").toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" })}
                                </Text>
                              )}
                            </HStack>

                            {/* Hours row */}
                            <HStack gap={2} align="center">
                              <Clock size={12} color="#A855F7" />
                              {editingHours === project.id ? (
                                <HStack gap={1}>
                                  <Input type="number" value={hoursInput} size="xs" w="70px"
                                    bg="purple.50" border="none" borderRadius="lg" fontWeight="700"
                                    onChange={(e) => setHoursInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && saveHours(project)} />
                                  <Button size="xs" colorPalette="purple" borderRadius="lg" onClick={() => saveHours(project)}>Save</Button>
                                  <Button size="xs" variant="ghost" borderRadius="lg" onClick={() => setEditingHours(null)}>✕</Button>
                                </HStack>
                              ) : (
                                <Text fontSize="xs" color="gray.500" fontWeight="600" cursor="pointer"
                                  onClick={() => { setEditingHours(project.id); setHoursInput(String(project.hours_spent)); }}
                                  title="Click to update hours spent">
                                  {project.hours_spent}h spent
                                  {project.estimated_hours ? ` / ${project.estimated_hours}h` : ""}
                                  <Text as="span" color="purple.300"> (click to update)</Text>
                                </Text>
                              )}
                            </HStack>

                            {/* Hours progress bar */}
                            {hrsPct !== null && (
                              <Box w="100%" h="4px" bg="purple.50" borderRadius="full" overflow="hidden">
                                <Box h="100%" borderRadius="full" transition="width 0.4s ease"
                                  style={{
                                    width: `${hrsPct}%`,
                                    background: hrsPct >= 100
                                      ? "linear-gradient(90deg,#10B981,#34D399)"
                                      : "linear-gradient(90deg,#A855F7,#EC4899)",
                                  }} />
                              </Box>
                            )}
                          </VStack>

                          {/* Right side controls */}
                          <VStack align="end" gap={2} flexShrink={0}>
                            {/* Status badge */}
                            <Badge colorPalette={cfg.chakra} variant="subtle" borderRadius="full"
                              px={3} py={1} cursor="pointer" fontSize="11px" fontWeight="800"
                              onClick={() => cycleStatus(project)} title="Click to change status">
                              <HStack gap={1}>{cfg.icon}<span>{cfg.label}</span></HStack>
                            </Badge>

                            {/* Certificate toggle (only for done) */}
                            {project.status === "done" && (
                              <Badge
                                colorPalette={project.certificate ? "yellow" : "gray"}
                                variant={project.certificate ? "solid" : "outline"}
                                borderRadius="full" px={2} py={0.5} cursor="pointer"
                                fontSize="10px" fontWeight="700"
                                onClick={() => toggleCertificate(project)}
                                title="Toggle certificate">
                                <HStack gap={1}><Award size={11} /><span>Cert</span></HStack>
                              </Badge>
                            )}

                            {/* Subtask count */}
                            {subtasks.length > 0 && (
                              <Text fontSize="xs" fontWeight="800" color="purple.400">
                                {doneTasks}/{subtasks.length} tasks
                              </Text>
                            )}

                            <IconButton aria-label="Delete" size="xs" variant="ghost" colorPalette="red"
                              borderRadius="lg" onClick={() => deleteProject(project.id)}>
                              <Trash2 size={13} />
                            </IconButton>
                          </VStack>
                        </HStack>

                        {/* Subtask progress bar */}
                        {subtasks.length > 0 && (
                          <Box px={4} pb={isExpanded ? 0 : 3}>
                            <Box h="3px" bg="purple.50" borderRadius="full" overflow="hidden">
                              <Box h="100%" borderRadius="full" transition="width 0.4s ease"
                                style={{
                                  width: `${(doneTasks / subtasks.length) * 100}%`,
                                  background: doneTasks === subtasks.length
                                    ? "linear-gradient(90deg,#10B981,#34D399)"
                                    : "linear-gradient(90deg,#A855F7,#EC4899)",
                                }} />
                            </Box>
                          </Box>
                        )}

                        {/* Expanded: subtasks */}
                        {isExpanded && (
                          <Box px={4} pb={4} pt={3} borderTop="1px solid" borderColor="gray.50">
                            <Text fontSize="10px" fontWeight="800" color="gray.400" letterSpacing="wider" mb={3}>SUBTASKS</Text>
                            <VStack gap={2} align="stretch">
                              {subtasks.length === 0 && (
                                <Text fontSize="xs" color="gray.400" textAlign="center" py={2}>No subtasks yet</Text>
                              )}
                              {subtasks.map((sub) => (
                                <HStack key={sub.id} gap={3} px={2} py={1.5} borderRadius="xl"
                                  bg={sub.completed ? "green.50" : "gray.50"}
                                  transition="background 0.2s" className="group">
                                  <Box w="18px" h="18px" borderRadius="md" flexShrink={0} cursor="pointer"
                                    border="2px solid" style={{ borderColor: sub.completed ? "#10B981" : "#d8b4fe" }}
                                    bg={sub.completed ? "green.400" : "white"}
                                    display="flex" alignItems="center" justifyContent="center"
                                    onClick={() => toggleSubtask(project.id, sub)}>
                                    {sub.completed && <CheckCircle2 size={11} color="white" />}
                                  </Box>
                                  <Text flex={1} fontSize="sm" fontWeight="600"
                                    color={sub.completed ? "gray.400" : "gray.700"}
                                    textDecoration={sub.completed ? "line-through" : "none"}>
                                    {sub.text}
                                  </Text>
                                  <IconButton aria-label="Delete subtask" size="xs" variant="ghost"
                                    colorPalette="red" borderRadius="lg"
                                    opacity={0} _groupHover={{ opacity: 1 }}
                                    onClick={() => deleteSubtask(project.id, sub.id)}>
                                    <Trash2 size={11} />
                                  </IconButton>
                                </HStack>
                              ))}
                              <HStack gap={2} mt={1}>
                                <Input placeholder="Add a subtask..."
                                  value={newSubtask[project.id] || ""} size="sm"
                                  bg="white" border="1px solid" borderColor="purple.100"
                                  borderRadius="xl" fontSize="sm"
                                  onChange={(e) => setNewSubtask((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && addSubtask(project.id)}
                                  _focus={{ boxShadow: "0 0 0 2px #d8b4fe", borderColor: "purple.300" }} />
                                <IconButton aria-label="Add subtask" size="sm" colorPalette="purple"
                                  borderRadius="xl" onClick={() => addSubtask(project.id)}>
                                  <Plus size={14} />
                                </IconButton>
                              </HStack>
                            </VStack>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            );
          })}

          {projects.length === 0 && (
            <Text textAlign="center" color="gray.400" py={12} fontSize="sm">
              No courses or projects yet — hit the button above to add one! 📚
            </Text>
          )}
        </VStack>

        {/* ── RIGHT: Daily Log ── */}
        <VStack gap={6} align="stretch" position="sticky" top="20px">
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(236,72,153,0.1)"
            border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={1}>What I Learned Today 🌸</Text>
            <Text fontSize="xs" color="gray.400" fontWeight="600" mb={5}>Your daily knowledge log</Text>
            <VStack gap={3} align="stretch">
              <Box>
                <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">DATE</Text>
                <Input type="date" value={logDate} bg="pink.50" border="none" borderRadius="xl"
                  onChange={(e) => setLogDate(e.target.value)}
                  _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">WHAT DID YOU LEARN?</Text>
                <Textarea placeholder="e.g. Learned about React hooks, finished module 3, understood flexbox..."
                  value={logText} bg="pink.50" border="none" borderRadius="xl" rows={4} resize="none"
                  onChange={(e) => setLogText(e.target.value)}
                  _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
              </Box>
              {logError && (
                <Box px={4} py={2.5} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.200">
                  <Text fontSize="sm" color="red.500" fontWeight="700">⚠️ {logError}</Text>
                </Box>
              )}
              <Button onClick={addLog} colorPalette="pink" borderRadius="full" fontWeight="800"
                boxShadow="0 4px 12px rgba(255,105,180,0.3)">
                <Plus size={16} style={{ marginRight: "6px" }} /> Log Entry
              </Button>
            </VStack>
          </Box>

          {logs.length > 0 && (
            <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(236,72,153,0.1)"
              border="2px solid" borderColor="pink.100" maxH="520px" overflowY="auto"
              css={{ "&::-webkit-scrollbar": { width: "5px" }, "&::-webkit-scrollbar-thumb": { background: "#FDA4AF", borderRadius: "10px" } }}>
              <Text fontWeight="800" fontSize="md" color="pink.500" mb={4}>Past Entries 📖</Text>
              <VStack gap={3} align="stretch">
                {logs.map((log) => (
                  <Box key={log.id} p={4} bg="pink.50" borderRadius="2xl"
                    border="1px solid" borderColor="pink.100" className="group" position="relative">
                    <HStack justify="space-between" mb={1.5}>
                      <Badge colorPalette="pink" variant="subtle" borderRadius="full" fontSize="10px" fontWeight="800">
                        {new Date(log.date + "T00:00:00").toLocaleDateString("en-MY", { weekday: "short", month: "short", day: "numeric" })}
                      </Badge>
                      <IconButton aria-label="Delete log" size="xs" variant="ghost" colorPalette="red"
                        borderRadius="full" opacity={0} _groupHover={{ opacity: 1 }}
                        onClick={() => deleteLog(log.id)}>
                        <Trash2 size={11} />
                      </IconButton>
                    </HStack>
                    <Text fontSize="sm" color="gray.700" fontWeight="500" style={{ whiteSpace: "pre-wrap" }}>
                      {log.content}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </SimpleGrid>
    </Box>
  );
};

export default LearningTracker;
