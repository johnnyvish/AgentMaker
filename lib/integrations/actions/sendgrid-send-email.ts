import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const sendgridSendEmail: Integration = createIntegration({
  id: "sendgrid_send_email",
  name: "SendGrid Send Email",
  category: "action",
  description: "Send emails via SendGrid",
  icon: "sendgrid",
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
        placeholder: "recipient@example.com",
        required: true,
      },
      {
        key: "from",
        type: "email",
        label: "From Email",
        placeholder: "sender@yourdomain.com",
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
        key: "content",
        type: "textarea",
        label: "Email Content",
        placeholder: "Email body content...",
        required: true,
        supportExpressions: true,
      },
      {
        key: "content_type",
        type: "select",
        label: "Content Type",
        required: false,
        options: [
          { label: "Text", value: "text/plain" },
          { label: "HTML", value: "text/html" },
        ],
      },
      {
        key: "template_id",
        type: "text",
        label: "Template ID",
        placeholder: "d-1234567890abcdef",
        required: false,
      },
      {
        key: "template_data",
        type: "textarea",
        label: "Template Data (JSON)",
        placeholder: '{"name": "John", "company": "Acme Corp"}',
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["to", "from", "subject", "content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          messageId: "abc123def456ghi789",
          to: config.to as string,
          from: config.from as string,
          subject: config.subject as string,
          content: config.content as string,
          contentType: (config.content_type as string) || "text/plain",
          templateId: (config.template_id as string) || "",
          templateData: config.template_data
            ? JSON.parse(config.template_data as string)
            : {},
          status: "delivered",
          sentAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "sendgrid_send_email" },
      };
    },
  },
});
