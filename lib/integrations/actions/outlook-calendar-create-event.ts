import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const outlookCalendarCreateEvent: Integration = createIntegration({
  id: "outlook_calendar_create_event",
  name: "Outlook Calendar Create Event",
  category: "action",
  description: "Create events in Microsoft Outlook/Exchange calendar",
  icon: "microsoft",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "subject",
        type: "text",
        label: "Event Subject",
        placeholder: "Team Meeting",
        required: true,
        supportExpressions: true,
      },
      {
        key: "body",
        type: "textarea",
        label: "Event Body",
        placeholder: "Meeting agenda and details...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "start_datetime",
        type: "text",
        label: "Start Date/Time",
        placeholder: "2024-12-01T10:00:00Z",
        required: true,
        supportExpressions: true,
      },
      {
        key: "end_datetime",
        type: "text",
        label: "End Date/Time",
        placeholder: "2024-12-01T11:00:00Z",
        required: true,
        supportExpressions: true,
      },
      {
        key: "attendees",
        type: "textarea",
        label: "Attendees (JSON array)",
        placeholder:
          '[{"emailAddress": {"address": "john@example.com", "name": "John Doe"}, "type": "required"}]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "location",
        type: "text",
        label: "Location",
        placeholder: "Conference Room A or Teams meeting link",
        required: false,
        supportExpressions: true,
      },
      {
        key: "is_all_day",
        type: "boolean",
        label: "All Day Event",
        required: false,
      },
      {
        key: "reminder_minutes",
        type: "number",
        label: "Reminder (minutes before)",
        placeholder: "15",
        required: false,
      },
      {
        key: "importance",
        type: "select",
        label: "Importance",
        required: false,
        options: [
          { label: "Low", value: "low" },
          { label: "Normal", value: "normal" },
          { label: "High", value: "high" },
        ],
      },
      {
        key: "sensitivity",
        type: "select",
        label: "Sensitivity",
        required: false,
        options: [
          { label: "Normal", value: "normal" },
          { label: "Personal", value: "personal" },
          { label: "Private", value: "private" },
          { label: "Confidential", value: "confidential" },
        ],
      },
    ],
    required: ["subject", "start_datetime", "end_datetime"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1300));
      const timestamp = new Date().toISOString();

      let attendees: Record<string, unknown>[] = [];
      if (config.attendees) {
        try {
          attendees = JSON.parse(config.attendees as string);
        } catch {
          attendees = [];
        }
      }

      const eventId = `outlook_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          eventId,
          subject: config.subject as string,
          body: (config.body as string) || "",
          startDateTime: config.start_datetime as string,
          endDateTime: config.end_datetime as string,
          attendees,
          location: (config.location as string) || "",
          isAllDay: (config.is_all_day as boolean) || false,
          reminderMinutes: (config.reminder_minutes as number) || 15,
          importance: (config.importance as string) || "normal",
          sensitivity: (config.sensitivity as string) || "normal",
          createdDateTime: timestamp,
          lastModifiedDateTime: timestamp,
          webLink: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
            config.subject as string
          )}`,
          status: "confirmed",
          timestamp,
        },
        metadata: {
          nodeType: "action",
          subtype: "outlook_calendar_create_event",
        },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.subject) {
        errors.subject = "Event subject is required";
      }

      if (!config.start_datetime) {
        errors.start_datetime = "Start date/time is required";
      }

      if (!config.end_datetime) {
        errors.end_datetime = "End date/time is required";
      }

      if (config.attendees) {
        try {
          JSON.parse(config.attendees as string);
        } catch {
          errors.attendees = "Attendees must be a valid JSON array";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
