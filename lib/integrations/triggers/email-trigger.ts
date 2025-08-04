import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const emailTrigger: Integration = createIntegration({
  id: "email_trigger",
  name: "Email Received",
  category: "trigger",
  description: "Trigger when emails are received",
  icon: "mail",
  version: "1.0.0",
  
  hasInputHandle: false,
  
  schema: {
    fields: [
      {
        key: "email_address",
        type: "email",
        label: "Monitor Email Address",
        placeholder: "automation@company.com",
        required: true,
      },
      {
        key: "subject_filter",
        type: "text",
        label: "Subject Filter (optional)",
        placeholder: "Order # or [URGENT]",
        required: false,
      },
      {
        key: "sender_filter",
        type: "text",
        label: "Sender Filter (optional)",
        placeholder: "@important-domain.com or specific@email.com",
        required: false,
      },
      {
        key: "include_attachments",
        type: "boolean",
        label: "Include Attachment Info",
        required: false,
      },
      {
        key: "max_emails_per_trigger",
        type: "number",
        label: "Max Emails per Trigger",
        placeholder: "10",
        required: false,
      },
      {
        key: "webhook_url",
        type: "url",
        label: "Webhook URL (generated)",
        placeholder: "https://api.yourapp.com/webhooks/email/xyz123",
        required: false,
      },
    ],
    required: ["email_address"],
  },

  executor: {
    async execute(config) {
      // Simulate email monitoring delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const emailAddress = config.email_address as string;
      const subjectFilter = config.subject_filter as string;
      const senderFilter = config.sender_filter as string;
      const includeAttachments = config.include_attachments as boolean || false;
      const maxEmails = (config.max_emails_per_trigger as number) || 1;

      // Mock email data
      const mockEmails = [
        {
          message_id: "<msg123@gmail.com>",
          from: "customer@example.com",
          to: emailAddress,
          subject: "Order #12345 - Urgent Question",
          body: "Hi, I have a question about my recent order. The delivery date seems to be delayed and I need this resolved quickly. Please let me know the status of my order #12345.",
          received_at: new Date().toISOString(),
          attachments: includeAttachments ? [
            {
              filename: "receipt.pdf",
              size: 45000,
              content_type: "application/pdf",
              content_id: "att_001"
            }
          ] : [],
          headers: {
            "message-id": "<msg123@gmail.com>",
            "date": new Date().toISOString(),
            "from": "customer@example.com",
            "to": emailAddress,
            "subject": "Order #12345 - Urgent Question",
            "content-type": "text/plain; charset=UTF-8"
          }
        },
        {
          message_id: "<msg456@gmail.com>",
          from: "support@important-domain.com",
          to: emailAddress,
          subject: "[URGENT] System Alert",
          body: "Critical system alert: Database connection timeout detected. Immediate attention required.",
          received_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          attachments: [],
          headers: {
            "message-id": "<msg456@gmail.com>",
            "date": new Date(Date.now() - 300000).toISOString(),
            "from": "support@important-domain.com",
            "to": emailAddress,
            "subject": "[URGENT] System Alert",
            "content-type": "text/plain; charset=UTF-8"
          }
        }
      ];

      // Apply filters
      let filteredEmails = mockEmails;
      
      if (subjectFilter) {
        filteredEmails = filteredEmails.filter(email => 
          email.subject.toLowerCase().includes(subjectFilter.toLowerCase())
        );
      }
      
      if (senderFilter) {
        filteredEmails = filteredEmails.filter(email => 
          email.from.toLowerCase().includes(senderFilter.toLowerCase())
        );
      }

      // Limit to max emails
      filteredEmails = filteredEmails.slice(0, maxEmails);

      return {
        success: true,
        data: {
          emails: filteredEmails,
          total_emails: filteredEmails.length,
          email_address: emailAddress,
          subject_filter: subjectFilter || null,
          sender_filter: senderFilter || null,
          include_attachments: includeAttachments,
          max_emails_per_trigger: maxEmails,
          trigger_time: new Date().toISOString(),
          webhook_url: config.webhook_url || null,
        },
        metadata: { nodeType: "trigger", subtype: "email_trigger" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.email_address) {
        errors.email_address = "Email address is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.email_address as string)) {
          errors.email_address = "Invalid email address format";
        }
      }

      if (config.max_emails_per_trigger && 
          (typeof config.max_emails_per_trigger !== "number" || config.max_emails_per_trigger <= 0)) {
        errors.max_emails_per_trigger = "Max emails must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 