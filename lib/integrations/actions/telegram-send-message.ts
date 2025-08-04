import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const telegramSendMessage: Integration = createIntegration({
  id: "telegram_send_message",
  name: "Send Telegram Message",
  category: "action",
  description: "Send messages via Telegram Bot",
  icon: "telegram",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "chat_id",
        type: "text",
        label: "Chat ID",
        placeholder: "123456789 or @channel_name",
        required: true,
      },
      {
        key: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Hello from the automation!",
        required: true,
        supportExpressions: true,
      },
      {
        key: "parse_mode",
        type: "select",
        label: "Parse Mode",
        required: false,
        options: [
          { label: "Plain Text", value: "text" },
          { label: "HTML", value: "HTML" },
          { label: "Markdown", value: "MarkdownV2" },
        ],
      },
      {
        key: "disable_web_page_preview",
        type: "boolean",
        label: "Disable Web Page Preview",
        required: false,
      },
      {
        key: "disable_notification",
        type: "boolean",
        label: "Silent Message",
        required: false,
      },
    ],
    required: ["chat_id", "message"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          messageId: 12345,
          chatId: config.chat_id as string,
          message: config.message as string,
          parseMode: (config.parse_mode as string) || "text",
          disableWebPagePreview:
            (config.disable_web_page_preview as boolean) || false,
          disableNotification:
            (config.disable_notification as boolean) || false,
          timestamp,
          from: {
            id: 987654321,
            isBot: true,
            firstName: "WorkflowBot",
            username: "workflow_bot",
          },
          chat: {
            id: 123456789,
            type: "private",
            title: "Test Chat",
          },
        },
        metadata: { nodeType: "action", subtype: "telegram_send_message" },
      };
    },
  },
});
