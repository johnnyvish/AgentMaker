import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const mailchimpAddSubscriber: Integration = createIntegration({
  id: "mailchimp_add_subscriber",
  name: "Mailchimp Add Subscriber",
  category: "action",
  description: "Add subscribers to Mailchimp lists",
  icon: "mailchimp",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "list_id",
        type: "text",
        label: "Audience ID",
        placeholder: "a1b2c3d4e5",
        required: true,
      },
      {
        key: "email",
        type: "email",
        label: "Email Address",
        placeholder: "subscriber@example.com",
        required: true,
      },
      {
        key: "first_name",
        type: "text",
        label: "First Name",
        placeholder: "John",
        required: false,
        supportExpressions: true,
      },
      {
        key: "last_name",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
        required: false,
        supportExpressions: true,
      },
      {
        key: "merge_fields",
        type: "textarea",
        label: "Merge Fields (JSON)",
        placeholder: '{"PHONE": "+1-555-123-4567", "COMPANY": "Acme Corp"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "tags",
        type: "text",
        label: "Tags (comma-separated)",
        placeholder: "newsletter, vip, customer",
        required: false,
      },
      {
        key: "status",
        type: "select",
        label: "Subscription Status",
        required: false,
        options: [
          { label: "Subscribed", value: "subscribed" },
          { label: "Unsubscribed", value: "unsubscribed" },
          { label: "Cleaned", value: "cleaned" },
          { label: "Pending", value: "pending" },
        ],
      },
    ],
    required: ["list_id", "email"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          subscriberId: "a1b2c3d4e5f6g7h8i9j0",
          listId: config.list_id as string,
          email: config.email as string,
          firstName: (config.first_name as string) || "",
          lastName: (config.last_name as string) || "",
          mergeFields: config.merge_fields
            ? JSON.parse(config.merge_fields as string)
            : {},
          tags: config.tags
            ? (config.tags as string).split(",").map((tag) => tag.trim())
            : [],
          status: (config.status as string) || "subscribed",
          subscribedAt: timestamp,
          lastChanged: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "mailchimp_add_subscriber" },
      };
    },
  },
});
