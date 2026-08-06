import type { TaskStatus } from "../types/task";

interface JiraTaskDTO {
  key: string;
  url: string;
  summary: string;
  dueDate: string | null;
  status: string;
  statusCategory: string;
  done: boolean;
  jiraPriority: string | null;
}

interface JiraTasksResponse {
  configured: boolean;
  tasks: JiraTaskDTO[];
  error?: string;
}

export interface JiraSourcedTask {
  id: string;
  text: string;
  completed: boolean;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: number;
  dueDate?: string;
  tags: string[];
  starred: boolean;
  archived: boolean;
  subtasks: never[];
  source: "jira";
  jiraKey: string;
  jiraUrl: string;
  jiraStatusLabel: string;
}

// Jira's statusCategory.key is a fixed Atlassian platform enum ("new" /
// "indeterminate" / "done"), unlike the free-text status name — robust
// across differently-configured workflows.
const mapStatus = (statusCategory: string): TaskStatus => {
  if (statusCategory === "done") return "done";
  if (statusCategory === "indeterminate") return "in_progress";
  return "not_started";
};

const mapPriority = (jiraPriority: string | null): "low" | "medium" | "high" => {
  if (!jiraPriority) return "medium";
  const p = jiraPriority.toLowerCase();
  if (p.includes("high")) return "high";
  if (p.includes("low")) return "low";
  return "medium";
};

/**
 * Fetches the current user's assigned Jira issues via the /api/jira-tasks proxy. Fails soft.
 *
 * Excludes Backlog-status issues; includes active issues plus anything resolved
 * in the last 30 days, so completing a task in Jira surfaces here as
 * `status: "done"` (and counts toward the Progress Tracker) for about a month
 * before aging out of the synced set.
 */
export const fetchJiraTasks = async (): Promise<JiraSourcedTask[]> => {
  try {
    const res = await fetch("/api/jira-tasks");
    if (!res.ok) return [];
    const data = (await res.json()) as JiraTasksResponse;
    if (!data.configured) return [];

    return data.tasks.map((t) => ({
      id: `jira-${t.key}`,
      text: t.summary,
      completed: t.done,
      status: mapStatus(t.statusCategory),
      priority: mapPriority(t.jiraPriority),
      createdAt: Date.now(),
      dueDate: t.dueDate ?? undefined,
      tags: [],
      starred: false,
      archived: false,
      subtasks: [],
      source: "jira" as const,
      jiraKey: t.key,
      jiraUrl: t.url,
      jiraStatusLabel: t.status,
    }));
  } catch {
    return [];
  }
};
