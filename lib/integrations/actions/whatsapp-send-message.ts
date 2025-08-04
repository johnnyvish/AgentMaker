import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const whatsappSendMessage: Integration = createIntegration({
  id: "whatsapp_send_message",
  name: "WhatsApp Send Message",
  category: "action",
  description: "Send messages via WhatsApp Business API",
  icon: "whatsapp",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "phone_number",
        type: "text",
        label: "Phone Number",
        placeholder: "+1234567890",
        required: true,
        supportExpressions: true,
      },
      {
        key: "message_type",
        type: "select",
        label: "Message Type",
        required: true,
        options: [
          { label: "Text", value: "text" },
          { label: "Image", value: "image" },
          { label: "Document", value: "document" },
          { label: "Audio", value: "audio" },
          { label: "Video", value: "video" },
          { label: "Location", value: "location" },
          { label: "Contact", value: "contact" },
          { label: "Template", value: "template" },
        ],
      },
      {
        key: "message_text",
        type: "textarea",
        label: "Message Text",
        placeholder: "Hello! Your order has been confirmed.",
        required: false,
        supportExpressions: true,
      },
      {
        key: "media_url",
        type: "url",
        label: "Media URL",
        placeholder: "https://example.com/image.jpg",
        required: false,
        supportExpressions: true,
      },
      {
        key: "media_caption",
        type: "text",
        label: "Media Caption",
        placeholder: "Check out this image",
        required: false,
        supportExpressions: true,
      },
      {
        key: "template_name",
        type: "text",
        label: "Template Name",
        placeholder: "order_confirmation",
        required: false,
        supportExpressions: true,
      },
      {
        key: "template_variables",
        type: "textarea",
        label: "Template Variables (JSON)",
        placeholder: '{"1": "John", "2": "12345", "3": "2024-12-01"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "language",
        type: "select",
        label: "Language",
        required: false,
        options: [
          { label: "English", value: "en" },
          { label: "Spanish", value: "es" },
          { label: "French", value: "fr" },
          { label: "German", value: "de" },
          { label: "Portuguese", value: "pt" },
          { label: "Arabic", value: "ar" },
        ],
      },
      {
        key: "preview_url",
        type: "boolean",
        label: "Preview URL",
        required: false,
      },
      {
        key: "reply_to",
        type: "text",
        label: "Reply To Message ID",
        placeholder: "wamid.1234567890",
        required: false,
        supportExpressions: true,
      },
      {
        key: "scheduled_time",
        type: "text",
        label: "Scheduled Time",
        placeholder: "2024-12-01T10:00:00Z",
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["phone_number", "message_type"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();
      
      const phoneNumber = config.phone_number as string;
      const messageType = config.message_type as string;
      const messageText = config.message_text as string || "";
      const mediaUrl = config.media_url as string || "";
      const mediaCaption = config.media_caption as string || "";
      const templateName = config.template_name as string || "";
      const language = (config.language as string) || "en";
      const previewUrl = (config.preview_url as boolean) || false;
      const replyTo = config.reply_to as string || "";
      const scheduledTime = config.scheduled_time as string || "";

      let templateVariables = {};
      if (config.template_variables) {
        try {
          templateVariables = JSON.parse(config.template_variables as string);
        } catch {
          templateVariables = {};
        }
      }

      const messageId = `wamid.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        data: {
          messageId,
          phoneNumber,
          messageType,
          messageText,
          mediaUrl: mediaUrl || null,
          mediaCaption: mediaCaption || null,
          templateName: templateName || null,
          templateVariables: Object.keys(templateVariables).length > 0 ? templateVariables : null,
          language,
          previewUrl,
          replyTo: replyTo || null,
          scheduledTime: scheduledTime || null,
          status: "sent",
          deliveredAt: timestamp,
          readAt: null,
          pricing: {
            billable: true,
            pricingModel: "conversation",
            category: "business_initiated",
          },
          conversation: {
            id: `conv_${Date.now()}`,
            origin: {
              type: "business_initiated",
            },
          },
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "whatsapp_send_message" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.phone_number) {
        errors.phone_number = "Phone number is required";
      }

      if (!config.message_type) {
        errors.message_type = "Message type is required";
      }

      if (config.message_type === "text" && !config.message_text) {
        errors.message_text = "Message text is required for text messages";
      }

      if (["image", "document", "audio", "video"].includes(config.message_type as string) && !config.media_url) {
        errors.media_url = "Media URL is required for media messages";
      }

      if (config.message_type === "template" && !config.template_name) {
        errors.template_name = "Template name is required for template messages";
      }

      if (config.template_variables) {
        try {
          JSON.parse(config.template_variables as string);
        } catch {
          errors.template_variables = "Template variables must be a valid JSON object";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 