interface JiraTaskDTO {
  key: string;
  url: string;
  summary: string;
  dueDate: string | null;
  status: string;
  done: boolean;
  jiraPriority: string | null;
}

interface JiraTasksResponse {
  configured: boolean;
  tasks: JiraTaskDTO[];
  error?: string;
}

export interface JiraSourcedTask {
  id: number;
  text: string;
  completed: boolean;
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
}

// Deterministic string -> positive int, so the same Jira issue always maps to the same task id.
const hashKey = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const mapPriority = (jiraPriority: string | null): "low" | "medium" | "high" => {
  if (!jiraPriority) return "medium";
  const p = jiraPriority.toLowerCase();
  if (p.includes("high")) return "high";
  if (p.includes("low")) return "low";
  return "medium";
};

/** Fetches the current user's assigned, unresolved Jira issues via the /api/jira-tasks proxy. Fails soft. */
export const fetchJiraTasks = async (): Promise<JiraSourcedTask[]> => {
  try {
    const res = await fetch("/api/jira-tasks");
    if (!res.ok) return [];
    const data = (await res.json()) as JiraTasksResponse;
    if (!data.configured) return [];

    return data.tasks.map((t) => ({
      id: hashKey(t.key),
      text: t.summary,
      completed: t.done,
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
    }));
  } catch {
    return [];
  }
};
