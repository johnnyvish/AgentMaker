import { createIntegration } from '../utils';
import type { Integration, ValidationResult } from '../types';

export const slackSendMessage: Integration = createIntegration({
  id: "slack_send_message",
  name: "Send Slack Message",
  category: "action",
  description: "Send a message to a Slack channel",
  icon: "slack",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "channel",
        type: "select",
        label: "Channel",
        placeholder: "#general",
        required: true,
        options: [
          { label: "#general", value: "general" },
          { label: "#random", value: "random" },
          { label: "#dev", value: "dev" },
        ],
      },
      {
        key: "message",
        type: "textarea",
        label: "Message",
        placeholder:
          "New deployment by {{$node.webhook-1.data.commits.0.author}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "username",
        type: "text",
        label: "Bot Username",
        placeholder: "WorkflowBot",
        required: false,
      },
    ],
    required: ["channel", "message"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          messageId: "1234567890.123456",
          channel: config.channel as string,
          message: config.message as string,
          timestamp,
          user: "U123ABCDEF",
          permalink:
            "https://workspace.slack.com/archives/C123/p1609459200123456",
        },
        metadata: { nodeType: "action", subtype: "slack_send_message" },
      };
    },

    validate(config): ValidationResult {
      const errors: Record<string, string> = {};

      if (!config.channel) errors.channel = "Channel is required";
      if (!config.message) errors.message = "Message is required";

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 