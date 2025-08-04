import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const jiraCreateIssue: Integration = createIntegration({
  id: "jira_create_issue",
  name: "Jira Create Issue",
  category: "action",
  description: "Create issues in Jira",
  icon: "jira",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "project_key",
        type: "text",
        label: "Project Key",
        placeholder: "PROJ",
        required: true,
      },
      {
        key: "issue_type",
        type: "select",
        label: "Issue Type",
        required: true,
        options: [
          { label: "Bug", value: "Bug" },
          { label: "Story", value: "Story" },
          { label: "Task", value: "Task" },
          { label: "Epic", value: "Epic" },
          { label: "Subtask", value: "Subtask" },
        ],
      },
      {
        key: "summary",
        type: "text",
        label: "Summary",
        placeholder: "Brief description of the issue",
        required: true,
        supportExpressions: true,
      },
      {
        key: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Detailed description of the issue...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "priority",
        type: "select",
        label: "Priority",
        required: false,
        options: [
          { label: "Highest", value: "Highest" },
          { label: "High", value: "High" },
          { label: "Medium", value: "Medium" },
          { label: "Low", value: "Low" },
          { label: "Lowest", value: "Lowest" },
        ],
      },
      {
        key: "assignee",
        type: "text",
        label: "Assignee",
        placeholder: "username",
        required: false,
      },
      {
        key: "labels",
        type: "text",
        label: "Labels (comma-separated)",
        placeholder: "bug, frontend, high-priority",
        required: false,
      },
    ],
    required: ["project_key", "issue_type", "summary"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          issueId: "PROJ-123",
          key: "PROJ-123",
          projectKey: config.project_key as string,
          issueType: config.issue_type as string,
          summary: config.summary as string,
          description: config.description as string || "",
          priority: config.priority as string || "Medium",
          assignee: config.assignee as string || "",
          labels: config.labels ? (config.labels as string).split(',').map(label => label.trim()) : [],
          status: "To Do",
          created: timestamp,
          updated: timestamp,
          reporter: "current-user",
          url: `https://company.atlassian.net/browse/${config.project_key}-123`,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "jira_create_issue" },
      };
    },
  },
}); 