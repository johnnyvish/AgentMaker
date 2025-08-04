import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const discordSendMessage: Integration = createIntegration({
  id: "discord_send_message",
  name: "Send Discord Message",
  category: "action",
  description: "Send messages to Discord channels",
  icon: "discord",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "channel_id",
        type: "text",
        label: "Channel ID",
        placeholder: "123456789012345678",
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
        key: "username",
        type: "text",
        label: "Bot Username",
        placeholder: "WorkflowBot",
        required: false,
      },
      {
        key: "avatar_url",
        type: "url",
        label: "Avatar URL",
        placeholder: "https://example.com/avatar.png",
        required: false,
      },
      {
        key: "tts",
        type: "boolean",
        label: "Text-to-Speech",
        required: false,
      },
    ],
    required: ["channel_id", "message"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          messageId: "1234567890123456789",
          channelId: config.channel_id as string,
          message: config.message as string,
          username: config.username as string || "WorkflowBot",
          tts: config.tts as boolean || false,
          timestamp,
          guildId: "987654321098765432",
          authorId: "111222333444555666",
        },
        metadata: { nodeType: "action", subtype: "discord_send_message" },
      };
    },
  },
}); 