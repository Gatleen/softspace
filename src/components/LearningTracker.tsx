import { useState, useEffect } from "react";
import { Box, Button, Input, Textarea, Text, HStack, VStack } from "@chakra-ui/react";
import {
  Plus, Trash2, ChevronDown, CheckCircle2, Lightbulb, Cog, ExternalLink, Award,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import SectionHeader from "./ui/SectionHeader";
import SoftSpaceCard from "./ui/SoftSpaceCard";
import { recordLearningState } from "../lib/achievements";

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
const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: React.ReactNode }> = {
  idea:        { label: "Upcoming",    icon: <Lightbulb size={11} />    },
  in_progress: { label: "In Progress", icon: <Cog size={11} />         },
  done:        { label: "Done",        icon: <CheckCircle2 size={11} /> },
};

const STATUS_STYLE: Record<ProjectStatus, { bg: string; color: string }> = {
  idea:        { bg: "#F6F0FF", color: "#8A6BD1" },
  in_progress: { bg: "#FFF7ED", color: "#C2410C" },
  done:        { bg: "#EDFBF1", color: "#0E9F6E" },
};

const STATUS_CYCLE: ProjectStatus[] = ["idea", "in_progress", "done"];

const CATEGORIES = ["Web Dev", "Design", "Data Science", "Mobile", "Languages", "Business", "Creative", "Other"];
const SOURCES    = ["Udemy", "Coursera", "YouTube", "freeCodeCamp", "edX", "LinkedIn Learning", "Book", "Blog", "Other"];

// Pastel accent cycling across categories (top color bar / ring / chips)
const CATEGORY_ACCENT: Record<string, string> = {
  "Web Dev": "#5B8FD6", Design: "#F27DAB", "Data Science": "#8A6BD1", Mobile: "#0E9F6E",
  Languages: "#F27DAB", Business: "#5B8FD6", Creative: "#8A6BD1", Other: "#0E9F6E",
};
const accentFor = (category: string) => CATEGORY_ACCENT[category] || "#F27DAB";

const emptyForm = {
  title: "", description: "", status: "idea" as ProjectStatus,
  started_at: new Date().toISOString().split("T")[0],
  source_name: "", source_url: "", category: "Other",
  estimated_hours: "", hours_spent: "0",
};

// ─── Small presentational helpers ──────────────────────────────────────────────

/** Circular completion ring — background track + progress arc + centered % label. */
const ProgressRing = ({ pct, color }: { pct: number; color: string }) => {
  const size = 82;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
        <Text fontFamily="'Jersey 25', cursive" fontSize="24px" color={color} lineHeight="1">
          {Math.round(pct)}%
        </Text>
      </Box>
    </Box>
  );
};

const StatCard = ({ label, value, sub, bg, color }: { label: string; value: string | number; sub: string; bg: string; color: string }) => (
  <Box
    style={{
      flex: 1, display: "flex", alignItems: "baseline", gap: "10px",
      background: bg, padding: "16px 18px", borderRadius: "20px",
      border: "2.5px solid white", boxShadow: "0 5px 0 rgba(255,199,222,.35)",
    }}
  >
    <Text fontFamily="'Jersey 25', cursive" fontSize="44px" lineHeight="1" color={color}>{value}</Text>
    <VStack align="start" gap="2px">
      <Text fontSize="9.5px" fontWeight="800" letterSpacing="1.5px" color={color}>{label}</Text>
      <Text fontSize="11px" fontWeight="700" color="#A08B9B">{sub}</Text>
    </VStack>
  </Box>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="9.5px" fontWeight="800" color="#C2AECF" letterSpacing="1.5px" mb="4px">{children}</Text>
);

// Read-only derived completion % for the ring — subtasks first, else status/hours based.
const projectProgress = (project: Project): number => {
  const subtasks = project.subtasks || [];
  if (subtasks.length > 0) return (subtasks.filter((s) => s.completed).length / subtasks.length) * 100;
  if (project.status === "done") return 100;
  if (project.status === "in_progress") {
    if (project.estimated_hours) return Math.min((project.hours_spent / project.estimated_hours) * 100, 100);
    return 50;
  }
  return 0;
};

// Read-only derived "current streak" from daily log dates (grace day allowed).
const computeStreak = (logs: DailyLog[]): number => {
  if (logs.length === 0) return 0;
  const dateSet = new Set(logs.map((l) => l.date));
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  const cursor = new Date();
  if (!dateSet.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dateSet.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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
    recordLearningState({ projectsCount: projects.length + 1 });
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("learning_projects").delete().eq("id", id);
    if (!error) setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const cycleStatus = async (project: Project) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(project.status) + 1) % STATUS_CYCLE.length];
    const { error } = await supabase.from("learning_projects").update({ status: next }).eq("id", project.id);
    if (!error) {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: next } : p));
      if (next === "done") recordLearningState({ anyDone: true });
    }
  };

  const toggleCertificate = async (project: Project) => {
    const { error } = await supabase.from("learning_projects")
      .update({ certificate: !project.certificate }).eq("id", project.id);
    if (!error) {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, certificate: !p.certificate } : p));
      if (!project.certificate) recordLearningState({ anyCertificate: true });
    }
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
      <Text fontFamily="'Jersey 25', cursive" fontSize="22px" color="#F27DAB">Loading your study nook...</Text>
    </Box>
  );

  if (error) return (
    <Box p={6} bg="#FFF0F6" borderRadius="20px" border="2.5px solid" borderColor="#FFDDEB">
      <Text color="#C0577E" fontWeight="700">Supabase error: {error}</Text>
    </Box>
  );

  const projectCount    = projects.length;
  const totalHoursNum    = projects.reduce((sum, p) => sum + (p.hours_spent || 0), 0);
  const totalHoursLabel  = Number.isInteger(totalHoursNum) ? String(totalHoursNum) : totalHoursNum.toFixed(1);
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;
  const completedCount  = projects.filter((p) => p.status === "done").length;
  const streak           = computeStreak(logs);

  return (
    <Box>
      <SectionHeader
        title="Study Nook"
        meta={`${projectCount} project${projectCount === 1 ? "" : "s"} · ${totalHoursLabel} h logged`}
      />

      {/* ── Stat cards ── */}
      <Box display="flex" gap="14px" mb="22px" flexWrap="wrap">
        <StatCard label="TOTAL HOURS" value={totalHoursLabel} sub={`across ${projectCount} course${projectCount === 1 ? "" : "s"}`}
          bg="#FFF0F6" color="#F27DAB" />
        <StatCard label="IN PROGRESS" value={inProgressCount} sub="courses active now"
          bg="#F1F8FE" color="#5B8FD6" />
        <StatCard label="COMPLETED" value={completedCount} sub="finished so far"
          bg="#EDFBF1" color="#0E9F6E" />
        <StatCard label="STREAK" value={streak} sub="days in a row"
          bg="#F6F0FF" color="#8A6BD1" />
      </Box>

      <Box display="flex" gap="22px" alignItems="flex-start" flexWrap="wrap">

        {/* ── LEFT: Projects ── */}
        <Box flexGrow={1} flexShrink={1} flexBasis={{ base: "100%", md: "280px" }}>

          {/* Add project form — collapsible */}
          {showForm && (
            <Box
              mb="16px"
              style={{
                background: "white", borderRadius: "24px", padding: "20px 22px",
                boxShadow: "0 0 0 2.5px #FFE9F1, 0 6px 0 rgba(255,199,222,.4)",
              }}
            >
              <Text fontFamily="'Jersey 25', cursive" fontSize="22px" color="#C0577E" mb="14px">New Course / Project</Text>
              <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(2,1fr)" }} gap="14px">
                <Box style={{ gridColumn: "span 2" }}>
                  <FieldLabel>TITLE *</FieldLabel>
                  <Input placeholder="e.g. React Complete Guide, UI/UX Bootcamp..."
                    value={form.title} bg="#FFF6FA" border="none" borderRadius="12px"
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                </Box>
                <Box style={{ gridColumn: "span 2" }}>
                  <FieldLabel>DESCRIPTION</FieldLabel>
                  <Input placeholder="What will you learn?"
                    value={form.description} bg="#FFF6FA" border="none" borderRadius="12px"
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                </Box>
                <Box>
                  <FieldLabel>PLATFORM / SOURCE</FieldLabel>
                  <select value={form.source_name}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "none",
                      background: "#FFF6FA", fontSize: "14px", fontWeight: 600, color: "#4A3B52", outline: "none" }}
                    onChange={(e) => setForm({ ...form, source_name: e.target.value })}>
                    <option value="">Select platform...</option>
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Box>
                <Box>
                  <FieldLabel>COURSE URL</FieldLabel>
                  <Input placeholder="https://..."
                    value={form.source_url} bg="#FFF6FA" border="none" borderRadius="12px"
                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                </Box>
                <Box>
                  <FieldLabel>CATEGORY</FieldLabel>
                  <HStack flexWrap="wrap" gap="6px">
                    {CATEGORIES.map((cat) => {
                      const active = form.category === cat;
                      const accent = accentFor(cat);
                      return (
                        <Box key={cat} onClick={() => setForm({ ...form, category: cat })}
                          style={{
                            cursor: "pointer", padding: "4px 12px", borderRadius: "999px",
                            fontSize: "11px", fontWeight: 700,
                            background: active ? accent : `${accent}22`,
                            color: active ? "white" : accent,
                          }}>
                          {cat}
                        </Box>
                      );
                    })}
                  </HStack>
                </Box>
                <Box>
                  <FieldLabel>STATUS</FieldLabel>
                  <HStack gap="6px">
                    {STATUS_CYCLE.map((s) => {
                      const active = form.status === s;
                      const style = STATUS_STYLE[s];
                      return (
                        <Box key={s} onClick={() => setForm({ ...form, status: s })}
                          style={{
                            cursor: "pointer", padding: "5px 12px", borderRadius: "999px",
                            fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px",
                            background: active ? style.color : style.bg,
                            color: active ? "white" : style.color,
                          }}>
                          {STATUS_CONFIG[s].icon}{STATUS_CONFIG[s].label}
                        </Box>
                      );
                    })}
                  </HStack>
                </Box>
                <Box>
                  <FieldLabel>DATE STARTED</FieldLabel>
                  <Input type="date" value={form.started_at} bg="#FFF6FA" border="none" borderRadius="12px"
                    onChange={(e) => setForm({ ...form, started_at: e.target.value })}
                    _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                </Box>
                <Box>
                  <FieldLabel>ESTIMATED HOURS</FieldLabel>
                  <Input type="number" placeholder="e.g. 20"
                    value={form.estimated_hours} bg="#FFF6FA" border="none" borderRadius="12px"
                    onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                    _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                </Box>
              </Box>

              {formError && (
                <Box mt="14px" px="14px" py="10px" bg="#FFF0F6" borderRadius="12px" border="2px solid #FFDDEB">
                  <Text fontSize="sm" color="#C0577E" fontWeight="700">{formError}</Text>
                </Box>
              )}

              <Button mt="16px" onClick={addProject}
                style={{
                  background: "linear-gradient(135deg,#FFC2DA,#CDB4F6)", border: "2.5px solid white",
                  borderRadius: "999px", boxShadow: "0 5px 0 rgba(196,87,127,.22)",
                  fontFamily: "'Jersey 25', cursive", fontSize: "18px", color: "white", letterSpacing: ".5px",
                }}>
                <Plus size={15} style={{ marginRight: "6px" }} /> Add Course / Project
              </Button>
            </Box>
          )}

          <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(2,1fr)" }} gap="16px">
            {projects.map((project) => {
              const subtasks    = project.subtasks || [];
              const doneTasks   = subtasks.filter((s) => s.completed).length;
              const isExpanded  = expanded[project.id] ?? false;
              const accent      = accentFor(project.category);
              const pct         = projectProgress(project);
              const statusStyle = STATUS_STYLE[project.status];
              const cfg         = STATUS_CONFIG[project.status];

              return (
                <Box key={project.id} position="relative"
                  style={{
                    background: "white", borderRadius: "24px", overflow: "hidden",
                    boxShadow: "0 0 0 2.5px #FFE9F1, 0 6px 0 rgba(255,199,222,.4)",
                  }}>

                  {/* top color bar */}
                  <Box style={{ height: "8px", background: accent, opacity: 0.85 }} />

                  {/* delete project */}
                  <Box as="button" aria-label="Delete project" onClick={() => deleteProject(project.id)}
                    position="absolute" top="14px" right="16px"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#C2AECF", padding: "4px" }}>
                    <Trash2 size={14} />
                  </Box>

                  <Box style={{ padding: "18px 20px 20px", display: "flex", gap: "16px" }}>
                    <ProgressRing pct={pct} color={accent} />

                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fontFamily="'Jersey 25', cursive" fontSize="25px" color="#C0577E" lineHeight="1.15"
                        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "20px" }}>
                        {project.title}
                      </Text>

                      <HStack gap="6px" mt="6px" flexWrap="wrap">
                        <Box style={{ background: `${accent}22`, color: accent, fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "999px" }}>
                          {project.category}
                        </Box>
                        <Box onClick={() => cycleStatus(project)} title="Click to change status"
                          style={{
                            cursor: "pointer", background: statusStyle.bg, color: statusStyle.color,
                            fontSize: "10px", fontWeight: 800, padding: "3px 10px", borderRadius: "999px",
                            display: "flex", alignItems: "center", gap: "4px",
                          }}>
                          {cfg.icon}{cfg.label}
                        </Box>
                        {project.status === "done" && (
                          <Box onClick={() => toggleCertificate(project)} title="Toggle certificate"
                            style={{
                              cursor: "pointer", fontSize: "10px", fontWeight: 800, padding: "3px 8px",
                              borderRadius: "999px", display: "flex", alignItems: "center", gap: "3px",
                              background: project.certificate ? "#FFF7ED" : "#F6F0FF",
                              color: project.certificate ? "#C2410C" : "#C2AECF",
                            }}>
                            <Award size={11} /> Cert
                          </Box>
                        )}
                      </HStack>

                      <Box mt="8px" style={{ fontSize: "10.5px", fontWeight: 700, color: "#B79ACB", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                        {project.source_name && (
                          project.source_url ? (
                            <a
                              href={project.source_url.startsWith("http") ? project.source_url : `https://${project.source_url}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ color: "#B79ACB", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <ExternalLink size={10} /> {project.source_name}
                            </a>
                          ) : <span>{project.source_name}</span>
                        )}
                        {project.source_name && <span>·</span>}
                        {editingHours === project.id ? (
                          <HStack gap="4px">
                            <Input type="number" value={hoursInput} size="xs" w="60px"
                              bg="#FFF6FA" border="none" borderRadius="8px" fontWeight="700"
                              onChange={(e) => setHoursInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveHours(project)} />
                            <Box as="button" onClick={() => saveHours(project)} style={{ color: "#0E9F6E", cursor: "pointer", background: "none", border: "none" }}>✓</Box>
                            <Box as="button" onClick={() => setEditingHours(null)} style={{ color: "#C2AECF", cursor: "pointer", background: "none", border: "none" }}>✕</Box>
                          </HStack>
                        ) : (
                          <span
                            onClick={() => { setEditingHours(project.id); setHoursInput(String(project.hours_spent)); }}
                            style={{ cursor: "pointer" }} title="Click to update hours spent">
                            {project.hours_spent}{project.estimated_hours ? `/${project.estimated_hours}` : ""} h
                          </span>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Footer: lessons */}
                  <Box style={{ padding: "0 20px 16px" }}>
                    <Box style={{ borderTop: "2px dotted #FFE9F1", marginTop: "0", paddingTop: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <Text style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "1.5px", color: "#C2AECF" }}>LESSONS</Text>
                      <HStack gap="6px" flexWrap="wrap">
                        {subtasks.map((sub) => (
                          <Box key={sub.id} as="button" onClick={() => toggleSubtask(project.id, sub)} title={sub.text}
                            style={{
                              width: "22px", height: "22px", borderRadius: "8px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: sub.completed ? accent : "white",
                              border: sub.completed ? "none" : `2px solid ${accent}`,
                            }}>
                            {sub.completed && <Text style={{ color: "white", fontSize: "12px", fontWeight: 800 }}>✓</Text>}
                          </Box>
                        ))}
                        <Box as="button" onClick={() => setExpanded((prev) => ({ ...prev, [project.id]: !isExpanded }))}
                          title="Manage lessons"
                          style={{
                            width: "22px", height: "22px", borderRadius: "8px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "2px dashed #FFC8DE", color: "#F27DAB", background: "white",
                          }}>
                          {isExpanded ? <ChevronDown size={12} /> : <Plus size={12} />}
                        </Box>
                      </HStack>
                      <Text style={{ marginLeft: "auto", fontSize: "10.5px", fontWeight: 800, color: "#A08B9B", whiteSpace: "nowrap" }}>
                        {doneTasks} of {subtasks.length} lessons
                      </Text>
                    </Box>

                    {isExpanded && (
                      <VStack gap="6px" align="stretch" mt="10px">
                        {subtasks.length === 0 && (
                          <Text style={{ fontSize: "11px", color: "#C2AECF", textAlign: "center", padding: "6px 0" }}>No lessons yet</Text>
                        )}
                        {subtasks.map((sub) => (
                          <HStack key={sub.id} justify="space-between"
                            style={{ background: "#FFF9FC", border: "2px solid #FFE9F1", borderRadius: "12px", padding: "8px 10px" }}>
                            <Text style={{
                              fontSize: "12px", fontWeight: 600,
                              color: sub.completed ? "#C2AECF" : "#5C4A63",
                              textDecoration: sub.completed ? "line-through" : "none",
                            }}>
                              {sub.text}
                            </Text>
                            <Box as="button" aria-label="Delete lesson" onClick={() => deleteSubtask(project.id, sub.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#C2AECF" }}>
                              <Trash2 size={12} />
                            </Box>
                          </HStack>
                        ))}
                        <HStack gap="6px">
                          <Input placeholder="Add a lesson..." value={newSubtask[project.id] || ""} size="sm"
                            bg="white" border="2px solid #FFE9F1" borderRadius="12px" fontSize="12px"
                            onChange={(e) => setNewSubtask((prev) => ({ ...prev, [project.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && addSubtask(project.id)}
                            _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
                          <Box as="button" aria-label="Add lesson" onClick={() => addSubtask(project.id)}
                            style={{
                              background: accent, color: "white", border: "none", borderRadius: "10px",
                              width: "32px", height: "32px", display: "flex", alignItems: "center",
                              justifyContent: "center", cursor: "pointer", flexShrink: 0,
                            }}>
                            <Plus size={14} />
                          </Box>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                </Box>
              );
            })}

            {/* Add course / project trigger */}
            <Box onClick={() => setShowForm((v) => !v)}
              style={{
                gridColumn: "span 2", border: "2.5px dashed #FFC8DE", borderRadius: "20px",
                padding: "22px", textAlign: "center", cursor: "pointer",
                fontFamily: "'Jersey 25', cursive", fontSize: "22px", color: "#F27DAB",
              }}>
              {showForm ? "− Close form" : "+ Add a course or project"}
            </Box>
          </Box>

          {projects.length === 0 && (
            <Text textAlign="center" color="#C2AECF" py={10} fontSize="sm" fontWeight="600">
              No courses or projects yet — hit the dashed button above to add one!
            </Text>
          )}
        </Box>

        {/* ── RIGHT: Daily Log ── */}
        <Box w={{ base: "100%", lg: "380px" }} flexShrink={0}>
          <SoftSpaceCard title="Daily Log" subtitle="What did you learn today?">
            <VStack gap="10px" align="stretch">
              <Box>
                <FieldLabel>DATE</FieldLabel>
                <Input type="date" value={logDate} bg="#FFF6FA" border="none" borderRadius="12px"
                  onChange={(e) => setLogDate(e.target.value)}
                  _focus={{ boxShadow: "0 0 0 2px #FFC2DA" }} />
              </Box>
              <Textarea
                placeholder="Today I finally understood..."
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                rows={3}
                bg="white"
                style={{
                  border: "2px dashed #EEDCFB", borderRadius: "16px", padding: "14px",
                  minHeight: "70px", fontSize: "13px", fontWeight: 600,
                  color: "#4A3B52", resize: "none",
                }}
              />
              {logError && (
                <Box px="14px" py="10px" bg="#FFF0F6" borderRadius="12px" border="2px solid #FFDDEB">
                  <Text fontSize="sm" color="#C0577E" fontWeight="700">{logError}</Text>
                </Box>
              )}
              <Button onClick={addLog}
                style={{
                  background: "linear-gradient(135deg,#FFC2DA,#CDB4F6)", border: "2.5px solid white",
                  borderRadius: "999px", boxShadow: "0 5px 0 rgba(196,87,127,.22)",
                  fontFamily: "'Jersey 25', cursive", fontSize: "18px", color: "white", letterSpacing: ".5px",
                }}>
                <Plus size={15} style={{ marginRight: "6px" }} /> Save log
              </Button>

              {logs.length > 0 && (
                <VStack gap="10px" align="stretch" mt="6px" maxH="420px" overflowY="auto"
                  css={{ "&::-webkit-scrollbar": { width: "5px" }, "&::-webkit-scrollbar-thumb": { background: "#FFC2DA", borderRadius: "10px" } }}>
                  {logs.map((log) => (
                    <Box key={log.id} position="relative"
                      style={{ padding: "13px 14px", borderRadius: "16px", background: "#FFF9FC", border: "2px solid #FFE9F1" }}>
                      <HStack justify="space-between" mb="4px">
                        <Text style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "1px", color: "#C2AECF" }}>
                          {new Date(log.date + "T00:00:00").toLocaleDateString("en-MY", { weekday: "short", month: "short", day: "numeric" })}
                        </Text>
                        <Box as="button" aria-label="Delete log" onClick={() => deleteLog(log.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#C2AECF" }}>
                          <Trash2 size={11} />
                        </Box>
                      </HStack>
                      <Text style={{ fontSize: "12.5px", fontWeight: 600, color: "#5C4A63", whiteSpace: "pre-wrap" }}>
                        {log.content}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          </SoftSpaceCard>
        </Box>
      </Box>
    </Box>
  );
};

export default LearningTracker;
