import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const smsSend: Integration = createIntegration({
  id: "sms_send",
  name: "Send SMS",
  category: "action",
  description: "Send SMS messages via Twilio",
  icon: "message-circle",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "to_number",
        type: "text",
        label: "To Phone Number",
        placeholder: "+1234567890",
        required: true,
      },
      {
        key: "from_number",
        type: "text",
        label: "From Phone Number",
        placeholder: "+1234567890",
        required: true,
      },
      {
        key: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Your verification code is: 123456",
        required: true,
        supportExpressions: true,
      },
      {
        key: "media_urls",
        type: "textarea",
        label: "Media URLs (JSON array)",
        placeholder: '["https://example.com/image.jpg"]',
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["to_number", "from_number", "message"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          messageId: "SM1234567890abcdef",
          toNumber: config.to_number as string,
          fromNumber: config.from_number as string,
          message: config.message as string,
          mediaUrls: config.media_urls
            ? JSON.parse(config.media_urls as string)
            : [],
          status: "delivered",
          sentAt: timestamp,
          deliveredAt: timestamp,
          price: 0.0075,
          priceUnit: "USD",
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "sms_send" },
      };
    },
  },
});
