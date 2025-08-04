import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const trelloCreateCard: Integration = createIntegration({
  id: "trello_create_card",
  name: "Trello Create Card",
  category: "action",
  description: "Create cards in Trello boards",
  icon: "trello",
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
        label: "Card Name",
        placeholder: "Implement new feature",
        required: true,
        supportExpressions: true,
      },
      {
        key: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Detailed description of the card...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "list_id",
        type: "text",
        label: "List ID",
        placeholder: "5f7b8c9d1a2b3c4d5e6f7g8",
        required: true,
      },
      {
        key: "due_date",
        type: "text",
        label: "Due Date",
        placeholder: "2024-12-31",
        required: false,
      },
      {
        key: "labels",
        type: "text",
        label: "Label IDs (comma-separated)",
        placeholder: "5f7b8c9d1a2b3c4d5e6f7g8, 5f7b8c9d1a2b3c4d5e6f7g9",
        required: false,
      },
      {
        key: "position",
        type: "select",
        label: "Position",
        required: false,
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
      },
    ],
    required: ["name", "list_id"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          cardId: "5f7b8c9d1a2b3c4d5e6f7g8",
          name: config.name as string,
          description: (config.description as string) || "",
          listId: config.list_id as string,
          dueDate: (config.due_date as string) || "",
          labels: config.labels
            ? (config.labels as string).split(",").map((id) => id.trim())
            : [],
          position: (config.position as string) || "bottom",
          shortUrl: "https://trello.com/c/abc123",
          url: "https://trello.com/c/abc123/implement-new-feature",
          createdAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "trello_create_card" },
      };
    },
  },
});
