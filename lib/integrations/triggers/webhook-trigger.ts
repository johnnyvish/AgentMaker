import { createIntegration } from '../utils';
import type { Integration } from '../types';

export const webhookTrigger: Integration = createIntegration({
  id: "webhook_trigger",
  name: "Webhook",
  category: "trigger",
  description: "Receive HTTP requests",
  icon: "link",
  version: "1.0.0",

  hasInputHandle: false,

  schema: {
    fields: [
      {
        key: "url",
        type: "url",
        label: "Webhook URL",
        placeholder: "https://...",
        required: true,
      },
      {
        key: "method",
        type: "select",
        label: "HTTP Method",
        required: true,
        options: [
          { label: "POST", value: "POST" },
          { label: "GET", value: "GET" },
          { label: "PUT", value: "PUT" },
        ],
      },
    ],
    required: ["url", "method"],
  },

  executor: {
    async execute() {
      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "user-agent": "GitHub-Hookshot/abc123",
          },
          body: {
            event: "push",
            repository: { name: "my-app", owner: "johndoe" },
            commits: [
              { message: "Fix user login bug", author: "Jane Smith" },
            ],
          },
          timestamp,
        },
        metadata: { nodeType: "trigger", subtype: "webhook_trigger" },
      };
    },
  },
}); 