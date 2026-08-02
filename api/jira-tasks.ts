import type { IncomingMessage, ServerResponse } from "http";

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    duedate: string | null;
    status: { name: string; statusCategory: { key: string } };
    priority: { name: string } | null;
  };
}

interface JiraTaskDTO {
  key: string;
  url: string;
  summary: string;
  dueDate: string | null;
  status: string;
  done: boolean;
  jiraPriority: string | null;
}

const JQL = "assignee = currentUser() AND statusCategory != Done ORDER BY due ASC";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const siteUrl = process.env.JIRA_SITE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  const send = (status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  // Jira not configured yet — degrade gracefully instead of erroring.
  if (!siteUrl || !email || !apiToken) {
    send(200, { configured: false, tasks: [] });
    return;
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    const params = new URLSearchParams({
      jql: JQL,
      fields: "summary,duedate,status,priority",
      maxResults: "100",
    });

    const jiraRes = await fetch(`https://${siteUrl}/rest/api/3/search/jql?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!jiraRes.ok) {
      send(jiraRes.status, { configured: true, tasks: [], error: `Jira returned ${jiraRes.status}` });
      return;
    }

    const data = (await jiraRes.json()) as { issues: JiraIssue[] };
    const tasks: JiraTaskDTO[] = (data.issues || []).map((issue) => ({
      key: issue.key,
      url: `https://${siteUrl}/browse/${issue.key}`,
      summary: issue.fields.summary,
      dueDate: issue.fields.duedate,
      status: issue.fields.status.name,
      done: issue.fields.status.statusCategory.key === "done",
      jiraPriority: issue.fields.priority?.name ?? null,
    }));

    send(200, { configured: true, tasks });
  } catch {
    send(200, { configured: true, tasks: [], error: "Failed to reach Jira" });
  }
}
