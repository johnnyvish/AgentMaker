import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const teamsSendMessage: Integration = createIntegration({
  id: "teams_send_message",
  name: "Send Teams Message",
  category: "action",
  description: "Post messages to Microsoft Teams channels",
  icon: "microsoft",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "team_id",
        type: "text",
        label: "Team ID",
        placeholder: "19:team@contoso.com",
        required: true,
      },
      {
        key: "channel_id",
        type: "text",
        label: "Channel ID",
        placeholder: "19:channel@contoso.com",
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
        key: "card_template",
        type: "select",
        label: "Card Template",
        required: false,
        options: [
          { label: "None", value: "none" },
          { label: "Hero Card", value: "hero" },
          { label: "Thumbnail Card", value: "thumbnail" },
          { label: "Adaptive Card", value: "adaptive" },
        ],
      },
    ],
    required: ["team_id", "channel_id", "message"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          messageId: "AAMkAGI1AAAt9AHjAAA=",
          teamId: config.team_id as string,
          channelId: config.channel_id as string,
          message: config.message as string,
          cardTemplate: config.card_template as string || "none",
          timestamp,
          webUrl: "https://teams.microsoft.com/l/message/19:channel@contoso.com/1234567890",
          createdBy: "user@contoso.com",
        },
        metadata: { nodeType: "action", subtype: "teams_send_message" },
      };
    },
  },
}); 