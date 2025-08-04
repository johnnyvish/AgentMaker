import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const githubCreateIssue: Integration = createIntegration({
  id: "github_create_issue",
  name: "GitHub Create Issue",
  category: "action",
  description: "Create issues in GitHub repositories",
  icon: "github",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "owner",
        type: "text",
        label: "Repository Owner",
        placeholder: "username",
        required: true,
      },
      {
        key: "repo",
        type: "text",
        label: "Repository Name",
        placeholder: "repository-name",
        required: true,
      },
      {
        key: "title",
        type: "text",
        label: "Issue Title",
        placeholder: "Bug: Application crashes on startup",
        required: true,
        supportExpressions: true,
      },
      {
        key: "body",
        type: "textarea",
        label: "Issue Description",
        placeholder: "Describe the issue in detail...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "labels",
        type: "text",
        label: "Labels (comma-separated)",
        placeholder: "bug, high-priority, frontend",
        required: false,
      },
      {
        key: "assignees",
        type: "text",
        label: "Assignees (comma-separated)",
        placeholder: "username1, username2",
        required: false,
      },
      {
        key: "milestone",
        type: "number",
        label: "Milestone ID",
        placeholder: "123",
        required: false,
      },
    ],
    required: ["owner", "repo", "title"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          issueId: 12345,
          number: 123,
          title: config.title as string,
          body: config.body as string || "",
          labels: config.labels ? (config.labels as string).split(',').map(label => label.trim()) : [],
          assignees: config.assignees ? (config.assignees as string).split(',').map(assignee => assignee.trim()) : [],
          milestone: config.milestone as number || null,
          state: "open",
          locked: false,
          createdAt: timestamp,
          updatedAt: timestamp,
          closedAt: null,
          author: "username",
          repository: `${config.owner}/${config.repo}`,
          url: `https://github.com/${config.owner}/${config.repo}/issues/${config.issue_id || 123}`,
          htmlUrl: `https://github.com/${config.owner}/${config.repo}/issues/${config.issue_id || 123}`,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "github_create_issue" },
      };
    },
  },
}); 