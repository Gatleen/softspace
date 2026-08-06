export type TaskStatus = "not_started" | "in_progress" | "done";

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: number;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  tags: string[];
  starred: boolean;
  archived: boolean;
  subtasks: Subtask[];
  source?: "local" | "jira";
  jiraKey?: string;
  jiraUrl?: string;
  /** Jira's real status display text (e.g. "In Review") — local tasks never set this. */
  jiraStatusLabel?: string;
}
