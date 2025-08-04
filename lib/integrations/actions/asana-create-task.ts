import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const asanaCreateTask: Integration = createIntegration({
  id: "asana_create_task",
  name: "Asana Create Task",
  category: "action",
  description: "Create tasks in Asana",
  icon: "asana",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "name",
        type: "text",
        label: "Task Name",
        placeholder: "Complete project documentation",
        required: true,
        supportExpressions: true,
      },
      {
        key: "notes",
        type: "textarea",
        label: "Description",
        placeholder: "Detailed description of the task...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "project_id",
        type: "text",
        label: "Project ID",
        placeholder: "123456789",
        required: false,
      },
      {
        key: "assignee_id",
        type: "text",
        label: "Assignee ID",
        placeholder: "987654321",
        required: false,
      },
      {
        key: "due_date",
        type: "text",
        label: "Due Date",
        placeholder: "2024-12-31",
        required: false,
      },
      {
        key: "priority",
        type: "select",
        label: "Priority",
        required: false,
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
    ],
    required: ["name"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          taskId: "123456789",
          name: config.name as string,
          notes: (config.notes as string) || "",
          projectId: (config.project_id as string) || "",
          assigneeId: (config.assignee_id as string) || "",
          dueDate: (config.due_date as string) || "",
          priority: (config.priority as string) || "medium",
          status: "incomplete",
          createdAt: timestamp,
          modifiedAt: timestamp,
          permalinkUrl: `https://app.asana.com/0/${
            config.project_id || "123456789"
          }/${config.task_id || "123456789"}`,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "asana_create_task" },
      };
    },
  },
});
