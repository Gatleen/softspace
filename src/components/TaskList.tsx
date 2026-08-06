import {
  Box,
  Checkbox,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  IconButton,
  Image,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { Flag, Calendar, SortAsc, Archive, Heart, ChevronDown, ChevronRight, Plus, ExternalLink } from "lucide-react";
import { getDueBucket, DUE_BUCKET_STYLE } from "../lib/dueDate";
import { STATUS_CONFIG, STATUS_STYLE, STATUS_CYCLE } from "../lib/taskStatus";
import { recordTaskCompleted, recordTaskStarred } from "../lib/achievements";
import { supabase } from "../lib/supabase";
import type { Task } from "../types/task";

type Priority = "low" | "medium" | "high";
type SortBy = "priority" | "date" | "name" | "dueDate";
type FilterBy = "all" | "active" | "completed";
type SourceFilter = "local" | "jira" | "all";

const PRIORITY_CONFIG: Record<Priority, { bg: string; color: string; dot: string; label: string }> = {
  low:    { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", label: "Low"    },
  medium: { bg: "#fff7ed", color: "#c2410c", dot: "#f97316", label: "Medium" },
  high:   { bg: "#fff1f2", color: "#be123c", dot: "#f43f5e", label: "High"   },
};

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskList = ({ tasks, setTasks }: Props) => {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("local");
  const [filterBy, setFilterBy] = useState<FilterBy>("active");
  const [sortBy] = useState<SortBy>("priority");
  const [sortAscending, setSortAscending] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  const [newTask, setNewTask] = useState({
    text: "",
    priority: "low" as Priority,
    dueDate: "",
    tags: "",
  });

  // --- LOGIC ---
  // Jira-sourced tasks are never persisted here — they're always live-synced
  // from the Jira API each session (see fetchJiraTasks/Dashboard.tsx).
  const addTask = () => {
    if (!newTask.text.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.text,
      completed: false,
      status: "not_started",
      priority: newTask.priority,
      createdAt: Date.now(),
      dueDate: newTask.dueDate || undefined,
      tags: newTask.tags.split(",").map((t) => t.trim()).filter((t) => t),
      starred: false,
      archived: false,
      subtasks: [],
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({ text: "", priority: "low", dueDate: "", tags: "" });
    supabase.from("tasks").insert({
      id: task.id,
      text: task.text,
      completed: task.completed,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate ?? null,
      tags: task.tags,
      starred: task.starred,
      archived: task.archived,
      subtasks: task.subtasks,
    }).then(({ error }) => { if (error) console.warn("addTask:", error); });
  };

  // Only ever called with {starred} or {archived} — both column names match
  // the Task field names verbatim, so no camelCase/snake_case mapping needed.
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    const task = tasks.find((t) => t.id === id);
    if (task?.source === "jira") return;
    supabase.from("tasks").update(updates).eq("id", id)
      .then(({ error }) => { if (error) console.warn("updateTask:", error); });
  };

  // Single rule for every place a task can become (or un-become) done, so
  // recordTaskCompleted() fires exactly once per genuine not-done -> done
  // transition, regardless of which control triggered it (checkbox, status
  // pill, or subtask auto-complete below).
  const setTaskStatus = (taskId: string, status: Task["status"]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nowDone = status === "done";
    if (nowDone && !task.completed) recordTaskCompleted();
    const completedAt = nowDone ? new Date().toISOString() : undefined;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, completed: nowDone, completedAt } : t))
    );
    if (task.source === "jira") return;
    supabase.from("tasks").update({ status, completed: nowDone, completed_at: completedAt ?? null }).eq("id", taskId)
      .then(({ error }) => { if (error) console.warn("setTaskStatus:", error); });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSubtask = (taskId: string) => {
    const text = (subtaskInputs[taskId] || "").trim();
    if (!text) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextSubtasks = [...task.subtasks, { id: crypto.randomUUID(), text, completed: false }];
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks: nextSubtasks } : t)));
    setSubtaskInputs((prev) => ({ ...prev, [taskId]: "" }));
    supabase.from("tasks").update({ subtasks: nextSubtasks }).eq("id", taskId)
      .then(({ error }) => { if (error) console.warn("addSubtask:", error); });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedSubs = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    // auto-complete parent when all subtasks done
    const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);
    if (allDone && !task.completed) recordTaskCompleted();
    const completedAt = allDone ? new Date().toISOString() : undefined;
    const nextStatus = allDone ? "done" : task.status;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: updatedSubs, completed: allDone, status: nextStatus, completedAt }
          : t
      )
    );
    supabase.from("tasks").update({
      subtasks: updatedSubs, completed: allDone, status: nextStatus, completed_at: completedAt ?? null,
    }).eq("id", taskId).then(({ error }) => { if (error) console.warn("toggleSubtask:", error); });
  };

  // --- MEMOIZED DATA ---
  // Tasks narrowed to the selected source (Local / Jira / All) — feeds both the
  // dropdown's counts and the search/sort pipeline below.
  const sourceFilteredTasks = useMemo(() => {
    if (sourceFilter === "all") return tasks;
    if (sourceFilter === "jira") return tasks.filter((t) => t.source === "jira");
    return tasks.filter((t) => t.source !== "jira");
  }, [tasks, sourceFilter]);

  const sourceCounts = useMemo(
    () => ({
      local: tasks.filter((t) => t.source !== "jira").length,
      jira: tasks.filter((t) => t.source === "jira").length,
      all: tasks.length,
    }),
    [tasks]
  );

  const statusCounts = useMemo(
    () => ({
      active: sourceFilteredTasks.filter((t) => !t.completed && !t.archived).length,
      completed: sourceFilteredTasks.filter((t) => t.completed && !t.archived).length,
      all: sourceFilteredTasks.filter((t) => !t.archived).length,
    }),
    [sourceFilteredTasks]
  );

  const filteredTasks = useMemo(() => {
    const matching = sourceFilteredTasks.filter((t) => {
      const matchesFilter =
        filterBy === "active"
          ? !t.completed && !t.archived
          : filterBy === "completed"
            ? t.completed && !t.archived
            : !t.archived;

      const matchesSearch = t.text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    // "Done" is a history view — always most-recently-finished first,
    // independent of the priority/name sort control used by the other filters.
    if (filterBy === "completed") {
      return [...matching].sort(
        (a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime()
      );
    }

    return matching.sort((a, b) => {
      const order = sortAscending ? 1 : -1;
      if (sortBy === "priority") {
        const weights = { low: 1, medium: 2, high: 3 };
        return (weights[a.priority] - weights[b.priority]) * order;
      }
      return a.text.localeCompare(b.text) * order;
    });
  }, [sourceFilteredTasks, filterBy, searchQuery, sortBy, sortAscending]);

  return (
    <Box
      bg="white"
      borderRadius="24px"
      border="2.5px solid"
      borderColor="#FFDDEB"
      boxShadow="0 6px 0 rgba(255,199,222,.45)"
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
              <Image src="/icons/Task.png" alt="Tasks" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontFamily="'Jersey 25', cursive" fontSize="24px" color="white" letterSpacing=".6px" textShadow="0 2px 0 rgba(196,87,127,.3)" lineHeight="1.1">
                My Daily Tasks
              </Text>
              <Text fontSize="10.5px" color="rgba(255,255,255,.9)" fontWeight="700">
                Stay Girly, Stay Productive
              </Text>
            </VStack>
          </HStack>
          <Box
            px="12px" py="5px" borderRadius="999px"
            bg="rgba(255,255,255,.4)"
          >
            <Text fontSize="11px" fontWeight="800" color="white">
              {sourceFilteredTasks.filter((t) => !t.completed).length} to do
            </Text>
          </Box>
        </HStack>
      </Box>

      <Box px={5} pt={4} pb={5}>
        {/* Search + source filter + sort */}
        <HStack mb={4} gap={2} flexWrap="wrap">
          <Input
            placeholder="Search my dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="gray.50"
            borderRadius="full"
            border="1.5px solid"
            borderColor="pink.100"
            _focus={{ borderColor: "pink.300", boxShadow: "0 0 0 3px rgba(244,114,182,0.15)" }}
            _placeholder={{ color: "gray.300" }}
            flex="1"
            minW="140px"
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            style={{
              background: "white",
              borderRadius: "999px",
              border: "1.5px solid #FBCFE8",
              fontSize: "12px",
              fontWeight: 700,
              color: "#DB2777",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <option value="local">Show: Local ({sourceCounts.local})</option>
            <option value="jira">Show: Jira ({sourceCounts.jira})</option>
            <option value="all">Show: All ({sourceCounts.all})</option>
          </select>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            style={{
              background: "white",
              borderRadius: "999px",
              border: "1.5px solid #FBCFE8",
              fontSize: "12px",
              fontWeight: 700,
              color: "#DB2777",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            <option value="active">Status: Active ({statusCounts.active})</option>
            <option value="completed">Status: Done ({statusCounts.completed})</option>
            <option value="all">Status: All ({statusCounts.all})</option>
          </select>
          <IconButton
            aria-label="Sort"
            variant="subtle"
            colorPalette="pink"
            rounded="full"
            onClick={() => setSortAscending(!sortAscending)}
          >
            <SortAsc size={18} />
          </IconButton>
        </HStack>

        {/* ➕ Add task form */}
        <Box
          bg="linear-gradient(135deg, #fdf2f8, #faf5ff)"
          p={4} borderRadius="2xl" mb={5}
          border="1.5px solid" borderColor="pink.100"
        >
          <HStack mb={3} gap={2}>
            <Box w="3px" h="14px" borderRadius="full"
              bg="linear-gradient(to bottom, #f472b6, #c084fc)" />
            <Text fontSize="xs" fontWeight="800" color="pink.500"
              textTransform="uppercase" letterSpacing="wider">
              New Task
            </Text>
          </HStack>
          <VStack gap={3}>
            <HStack width="100%" gap={2}>
              <Input
                placeholder="What's the tea today?"
                value={newTask.text}
                onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                bg="white"
                borderRadius="xl"
                border="1.5px solid"
                borderColor="pink.100"
                _focus={{ borderColor: "pink.300", boxShadow: "0 0 0 3px rgba(244,114,182,0.15)" }}
                _placeholder={{ color: "gray.300" }}
              />
              <Button
                onClick={addTask}
                borderRadius="xl"
                style={{ background: "linear-gradient(135deg, #f472b6, #c084fc)", boxShadow: "0 4px 12px rgba(192,132,252,0.35)" }}
                color="white"
                fontWeight="800"
                _hover={{ opacity: 0.9 }}
                flexShrink={0}
              >
                Add 🎀
              </Button>
            </HStack>
            <HStack width="100%" gap={3}>
              {/* Priority cycle badge */}
              <Box
                as="button"
                px={3} py="4px"
                bg="white"
                borderRadius="full"
                border="1.5px solid"
                borderColor={PRIORITY_CONFIG[newTask.priority].dot + "88"}
                display="inline-flex" alignItems="center" gap="6px"
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ transform: "scale(1.05)" }}
                onClick={() =>
                  setNewTask({
                    ...newTask,
                    priority: newTask.priority === "high" ? "low" : newTask.priority === "low" ? "medium" : "high",
                  })
                }
              >
                <Box w="7px" h="7px" borderRadius="full" bg={PRIORITY_CONFIG[newTask.priority].dot} flexShrink={0} />
                <Text fontSize="11px" fontWeight="800" color={PRIORITY_CONFIG[newTask.priority].color}>
                  {PRIORITY_CONFIG[newTask.priority].label}
                </Text>
                <Flag size={11} color={PRIORITY_CONFIG[newTask.priority].dot} />
              </Box>
              <HStack gap={1} bg="white" px={2} py={1} borderRadius="full"
                border="1.5px solid" borderColor="gray.100" flex={1}>
                <Calendar size={12} color="#c084fc" />
                <Input
                  type="date" size="xs" fontSize="xs"
                  color="purple.500" border="none" bg="transparent" p={0}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </HStack>
            </HStack>
          </VStack>
        </Box>

      {/* 📋 The List */}
      <VStack gap={3} align="stretch">
        {filteredTasks.map((task) => {
          const pc = PRIORITY_CONFIG[task.priority];
          const isExpanded = expandedIds.has(task.id);
          const subCount = task.subtasks.length;
          const subDone = task.subtasks.filter((s) => s.completed).length;
          const subPct = subCount > 0 ? (subDone / subCount) * 100 : 0;

          return (
            <Box
              key={task.id}
              bg={task.completed ? "gray.50" : "white"}
              borderRadius="2xl"
              border="1px solid"
              borderColor={task.starred ? "pink.200" : "gray.100"}
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
              overflow="hidden"
            >
              {/* Main row */}
              <HStack p={4} gap={3} align="start">
                <Checkbox.Root
                  checked={task.completed}
                  disabled={task.source === "jira"}
                  onCheckedChange={() => {
                    if (task.source === "jira") return;
                    // Checking always jumps straight to "done"; unchecking always
                    // resets to "not_started" — this intentionally does NOT restore
                    // a prior "in_progress" state, it's a deliberate simplification
                    // for this quick-toggle shortcut (use the status pill for that).
                    setTaskStatus(task.id, task.completed ? "not_started" : "done");
                  }}
                  colorPalette="pink"
                  mt="2px"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control borderRadius="full">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Root>

                <VStack flex="1" align="start" gap={1}>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color={task.completed ? "gray.400" : "pink.700"}
                    textDecoration={task.completed ? "line-through" : "none"}
                    lineHeight="1.3"
                  >
                    {task.text}
                  </Text>

                  <HStack gap={2} flexWrap="wrap">
                    {/* Coloured priority badge */}
                    <Box
                      px={2} py="2px"
                      bg={pc.bg}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={pc.dot + "55"}
                      display="inline-flex"
                      alignItems="center"
                      gap="5px"
                    >
                      <Box w="6px" h="6px" borderRadius="full" bg={pc.dot} flexShrink={0} />
                      <Text fontSize="10px" fontWeight="800" color={pc.color}>
                        {pc.label}
                      </Text>
                    </Box>

                    {/* Status pill — cycles for local tasks, read-only (real Jira status) for synced ones */}
                    <Box
                      as="button"
                      title={task.source === "jira" ? undefined : "Click to change status"}
                      onClick={() => {
                        if (task.source === "jira") return;
                        const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
                        setTaskStatus(task.id, next);
                      }}
                      px={2} py="2px"
                      bg={STATUS_STYLE[task.status].bg}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={STATUS_STYLE[task.status].color + "33"}
                      display="inline-flex"
                      alignItems="center"
                      gap="5px"
                      cursor={task.source === "jira" ? "default" : "pointer"}
                      color={STATUS_STYLE[task.status].color}
                    >
                      {STATUS_CONFIG[task.status].icon}
                      <Text fontSize="10px" fontWeight="800" color={STATUS_STYLE[task.status].color}>
                        {task.source === "jira" && task.jiraStatusLabel ? task.jiraStatusLabel : STATUS_CONFIG[task.status].label}
                      </Text>
                    </Box>

                    {task.dueDate && (() => {
                      const bucket = DUE_BUCKET_STYLE[getDueBucket(task.dueDate)];
                      return (
                        <Box
                          px={2} py="2px"
                          bg={bucket.bg}
                          borderRadius="full"
                          border="1px solid"
                          borderColor={bucket.border}
                          display="inline-flex"
                          alignItems="center"
                          gap="5px"
                        >
                          <Box w="6px" h="6px" borderRadius="full" bg={bucket.dot} flexShrink={0} />
                          <Text fontSize="10px" fontWeight="800" color={bucket.fg}>
                            {bucket.label(task.dueDate)}
                          </Text>
                        </Box>
                      );
                    })()}

                    {task.source === "jira" && (
                      <a href={task.jiraUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <Box
                          px={2} py="2px"
                          bg="#F1F8FE"
                          borderRadius="full"
                          border="1px solid"
                          borderColor="#D8E9FB"
                          display="inline-flex"
                          alignItems="center"
                          gap="5px"
                          cursor="pointer"
                        >
                          <Text fontSize="10px" fontWeight="800" color="#5B8FD6">
                            {task.jiraKey}
                          </Text>
                          <ExternalLink size={10} color="#5B8FD6" />
                        </Box>
                      </a>
                    )}
                  </HStack>

                  {/* Subtask mini progress bar */}
                  {subCount > 0 && (
                    <HStack gap={2} w="full" mt={1}>
                      <Box flex={1} h="4px" bg="gray.100" borderRadius="full" overflow="hidden">
                        <Box
                          h="full" borderRadius="full"
                          bg="linear-gradient(90deg, #c084fc, #f472b6)"
                          w={`${subPct}%`}
                          transition="width 0.3s ease"
                        />
                      </Box>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold" flexShrink={0}>
                        {subDone}/{subCount}
                      </Text>
                    </HStack>
                  )}
                </VStack>

                <HStack gap={0}>
                  {task.source === "jira" ? (
                    <IconButton
                      aria-label="Open in Jira"
                      variant="ghost"
                      rounded="full"
                      size="sm"
                      onClick={() => window.open(task.jiraUrl, "_blank", "noreferrer")}
                      color="#5B8FD6"
                    >
                      <ExternalLink size={15} />
                    </IconButton>
                  ) : (
                    <>
                      <IconButton
                        aria-label="Star"
                        variant="ghost"
                        rounded="full"
                        size="sm"
                        onClick={() => {
                          const nowStarred = !task.starred;
                          updateTask(task.id, { starred: nowStarred });
                          if (nowStarred) recordTaskStarred();
                        }}
                      >
                        <Heart size={15} fill={task.starred ? "#FF69B4" : "none"} color="#FF69B4" />
                      </IconButton>
                      <IconButton
                        aria-label="Subtasks"
                        variant="ghost"
                        rounded="full"
                        size="sm"
                        onClick={() => toggleExpand(task.id)}
                        color="purple.300"
                      >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </IconButton>
                      <IconButton
                        aria-label="Archive"
                        variant="ghost"
                        rounded="full"
                        size="sm"
                        onClick={() => updateTask(task.id, { archived: true })}
                      >
                        <Archive size={15} color="#D1D1D1" />
                      </IconButton>
                    </>
                  )}
                </HStack>
              </HStack>

              {/* Subtasks panel */}
              {isExpanded && (
                <Box
                  px={5} pb={4}
                  borderTop="1px solid"
                  borderColor="gray.50"
                  bg="purple.50"
                >
                  <VStack align="stretch" gap={1} pt={3}>
                    {task.subtasks.length === 0 && (
                      <Text fontSize="xs" color="gray.400" fontStyle="italic" pb={1}>
                        No subtasks yet — add one below!
                      </Text>
                    )}
                    {task.subtasks.map((sub) => (
                      <HStack
                        key={sub.id}
                        gap={2}
                        p={2}
                        bg={sub.completed ? "white" : "white"}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={sub.completed ? "green.100" : "purple.100"}
                      >
                        <Checkbox.Root
                          checked={sub.completed}
                          onCheckedChange={() => toggleSubtask(task.id, sub.id)}
                          colorPalette="purple"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control style={{ borderRadius: "9999px" }}>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Root>
                        <Text
                          fontSize="sm"
                          color={sub.completed ? "gray.400" : "gray.600"}
                          textDecoration={sub.completed ? "line-through" : "none"}
                          flex={1}
                        >
                          {sub.text}
                        </Text>
                      </HStack>
                    ))}

                    {/* Add subtask input */}
                    <HStack mt={1} gap={2}>
                      <Input
                        size="sm"
                        placeholder="Add a subtask..."
                        value={subtaskInputs[task.id] || ""}
                        onChange={(e) =>
                          setSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addSubtask(task.id)}
                        bg="white"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="purple.100"
                        _focus={{ borderColor: "purple.300", boxShadow: "0 0 0 2px rgba(192,132,252,0.15)" }}
                        _placeholder={{ color: "gray.300" }}
                        flex={1}
                      />
                      <IconButton
                        aria-label="Add subtask"
                        size="sm"
                        colorPalette="purple"
                        variant="subtle"
                        borderRadius="xl"
                        onClick={() => addSubtask(task.id)}
                      >
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
    </Box>
  );
};

export default TaskList;
