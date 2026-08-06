import { Circle, Cog, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import type { TaskStatus } from "../types/task";

export const STATUS_CYCLE: TaskStatus[] = ["not_started", "in_progress", "done"];

export const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: ReactNode }> = {
  not_started: { label: "Not Started", icon: <Circle size={11} /> },
  in_progress: { label: "In Progress", icon: <Cog size={11} /> },
  done:        { label: "Done",        icon: <CheckCircle2 size={11} /> },
};

export const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  not_started: { bg: "#F6F0FF", color: "#8A6BD1" },
  in_progress: { bg: "#FFF7ED", color: "#C2410C" },
  done:        { bg: "#EDFBF1", color: "#0E9F6E" },
};
