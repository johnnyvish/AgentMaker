import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const emailSend: Integration = createIntegration({
  id: "email_send",
  name: "Send Email",
  category: "action",
  description: "Send an email message",
  icon: "mail",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "to",
        type: "email",
        label: "To Email",
        placeholder: "user@example.com",
        required: true,
      },
      {
        key: "subject",
        type: "text",
        label: "Subject",
        placeholder: "Email subject",
        required: true,
        supportExpressions: true,
      },
      {
        key: "body",
        type: "textarea",
        label: "Body",
        placeholder:
          "Hello {{$node.webhook-1.data.user.name}}, your order {{$node.webhook-1.data.order.id}} has been shipped!",
        required: true,
        supportExpressions: true,
      },
    ],
    required: ["to", "subject", "body"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          messageId: "<20241201120000.abc123@smtp.gmail.com>",
          to: config.to as string,
          subject: config.subject as string,
          status: "sent",
          deliveryTime: "2.3s",
          provider: "SendGrid",
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "email_send" },
      };
    },
  },
});
