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
import { Flag, Calendar, SortAsc, Archive, Heart, ChevronDown, ChevronRight, Plus } from "lucide-react";

type Priority = "low" | "medium" | "high";
type SortBy = "priority" | "date" | "name" | "dueDate";
type FilterBy = "all" | "active" | "completed" | "archived";

const PRIORITY_CONFIG: Record<Priority, { bg: string; color: string; dot: string; label: string }> = {
  low:    { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", label: "Low"    },
  medium: { bg: "#fff7ed", color: "#c2410c", dot: "#f97316", label: "Medium" },
  high:   { bg: "#fff1f2", color: "#be123c", dot: "#f43f5e", label: "High"   },
};

interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
  notes?: string;
  tags: string[];
  starred: boolean;
  archived: boolean;
  subtasks: Subtask[];
}

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskList = ({ tasks, setTasks }: Props) => {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy] = useState<FilterBy>("all");
  const [sortBy] = useState<SortBy>("priority");
  const [sortAscending, setSortAscending] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [subtaskInputs, setSubtaskInputs] = useState<Record<number, string>>({});

  const [newTask, setNewTask] = useState({
    text: "",
    priority: "low" as Priority,
    dueDate: "",
    tags: "",
  });

  // --- LOGIC ---
  const addTask = () => {
    if (!newTask.text.trim()) return;
    const task: Task = {
      id: Date.now(),
      text: newTask.text,
      completed: false,
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
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSubtask = (taskId: number) => {
    const text = (subtaskInputs[taskId] || "").trim();
    if (!text) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, { id: Date.now(), text, completed: false }] }
          : t
      )
    );
    setSubtaskInputs((prev) => ({ ...prev, [taskId]: "" }));
  };

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        // auto-complete parent when all subtasks done
        const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);
        return { ...t, subtasks: updatedSubs, completed: allDone };
      })
    );
  };

  // --- MEMOIZED DATA ---
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchesFilter =
          filterBy === "active"
            ? !t.completed && !t.archived
            : filterBy === "completed"
              ? t.completed && !t.archived
              : filterBy === "archived"
                ? t.archived
                : !t.archived;

        const matchesSearch = t.text
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const order = sortAscending ? 1 : -1;
        if (sortBy === "priority") {
          const weights = { low: 1, medium: 2, high: 3 };
          return (weights[a.priority] - weights[b.priority]) * order;
        }
        return a.text.localeCompare(b.text) * order;
      });
  }, [tasks, filterBy, searchQuery, sortBy, sortAscending]);

  return (
    <Box
      bg="white"
      borderRadius="3xl"
      border="1.5px solid"
      borderColor="pink.100"
      boxShadow="0 8px 32px rgba(255,182,193,0.15)"
      overflow="hidden"
    >
      {/* ── Gradient header ── */}
      <Box
        bg="linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)"
        px={6} pt={5} pb={5}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-20px" right="-20px" w="90px" h="90px"
          borderRadius="full" bg="whiteAlpha.100" />
        <Box position="absolute" bottom="-30px" left="20px" w="70px" h="70px"
          borderRadius="full" bg="whiteAlpha.100" />

        <HStack justify="space-between" position="relative">
          <HStack gap={3}>
            <Box
              w="42px" h="42px" borderRadius="xl"
              bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
              display="flex" alignItems="center" justifyContent="center" flexShrink={0}
            >
              <Image src="/icons/Task.png" alt="Tasks" boxSize="26px" objectFit="contain" />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontSize="lg" fontWeight="900" color="white" lineHeight="1">
                My Daily Tasks
              </Text>
              <Text fontSize="xs" color="whiteAlpha.800" fontWeight="bold">
                Stay Girly, Stay Productive
              </Text>
            </VStack>
          </HStack>
          <Box
            px={3} py={1} borderRadius="full"
            bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
          >
            <Text fontSize="xs" fontWeight="800" color="white">
              {tasks.filter((t) => !t.completed).length} to do
            </Text>
          </Box>
        </HStack>
      </Box>

      <Box px={5} pt={4} pb={5}>
        {/* Search + sort */}
        <HStack mb={4} gap={2}>
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
          />
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
                  onCheckedChange={() =>
                    updateTask(task.id, { completed: !task.completed })
                  }
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

                    {task.dueDate && (
                      <Box
                        px={2} py="2px"
                        bg="orange.50"
                        borderRadius="full"
                        border="1px solid"
                        borderColor="orange.100"
                        display="inline-flex"
                        alignItems="center"
                        gap="5px"
                      >
                        <Text fontSize="10px" fontWeight="800" color="orange.500">
                          ⏰ {task.dueDate}
                        </Text>
                      </Box>
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
                  <IconButton
                    aria-label="Star"
                    variant="ghost"
                    rounded="full"
                    size="sm"
                    onClick={() => updateTask(task.id, { starred: !task.starred })}
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
