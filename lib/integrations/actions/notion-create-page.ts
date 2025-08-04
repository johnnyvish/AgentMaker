import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const notionCreatePage: Integration = createIntegration({
  id: "notion_create_page",
  name: "Notion Create Page",
  category: "action",
  description: "Create pages in Notion",
  icon: "notion",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "parent_id",
        type: "text",
        label: "Parent Page/Database ID",
        placeholder: "12345678-1234-1234-1234-123456789abc",
        required: true,
      },
      {
        key: "title",
        type: "text",
        label: "Page Title",
        placeholder: "New Page Title",
        required: true,
        supportExpressions: true,
      },
      {
        key: "content",
        type: "textarea",
        label: "Page Content",
        placeholder: "Page content in Notion format...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "properties",
        type: "textarea",
        label: "Properties (JSON)",
        placeholder:
          '{"Status": {"select": {"name": "In Progress"}}, "Priority": {"select": {"name": "High"}}}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "icon",
        type: "text",
        label: "Page Icon",
        placeholder: "🚀",
        required: false,
      },
      {
        key: "cover",
        type: "url",
        label: "Cover Image URL",
        placeholder: "https://example.com/image.jpg",
        required: false,
      },
    ],
    required: ["parent_id", "title"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          pageId: "12345678-1234-1234-1234-123456789abc",
          parentId: config.parent_id as string,
          title: config.title as string,
          content: (config.content as string) || "",
          properties: config.properties
            ? JSON.parse(config.properties as string)
            : {},
          icon: (config.icon as string) || "",
          cover: (config.cover as string) || "",
          createdTime: timestamp,
          lastEditedTime: timestamp,
          url: `https://notion.so/${
            config.page_id || "12345678-1234-1234-1234-123456789abc"
          }`,
          archived: false,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "notion_create_page" },
      };
    },
  },
});
