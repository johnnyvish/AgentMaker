import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const googleCalendarCreateEvent: Integration = createIntegration({
  id: "google_calendar_create_event",
  name: "Google Calendar Create Event",
  category: "action",
  description:
    "Create calendar events, check availability, send meeting invites",
  icon: "google",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "summary",
        type: "text",
        label: "Event Title",
        placeholder: "Team Meeting",
        required: true,
        supportExpressions: true,
      },
      {
        key: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Meeting agenda and details...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "start_time",
        type: "text",
        label: "Start Time",
        placeholder: "2024-12-01T10:00:00Z",
        required: true,
        supportExpressions: true,
      },
      {
        key: "end_time",
        type: "text",
        label: "End Time",
        placeholder: "2024-12-01T11:00:00Z",
        required: true,
        supportExpressions: true,
      },
      {
        key: "attendees",
        type: "textarea",
        label: "Attendees (JSON array)",
        placeholder: '["john@example.com", "jane@example.com"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "location",
        type: "text",
        label: "Location",
        placeholder:
          "Conference Room A or https://meet.google.com/abc-defg-hij",
        required: false,
        supportExpressions: true,
      },
      {
        key: "timezone",
        type: "text",
        label: "Timezone",
        placeholder: "America/New_York",
        required: false,
      },
      {
        key: "reminders",
        type: "textarea",
        label: "Reminders (JSON)",
        placeholder:
          '{"useDefault": false, "overrides": [{"method": "email", "minutes": 24 * 60}, {"method": "popup", "minutes": 10}]}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "send_updates",
        type: "select",
        label: "Send Updates",
        required: false,
        options: [
          { label: "All", value: "all" },
          { label: "External Only", value: "externalOnly" },
          { label: "None", value: "none" },
        ],
      },
    ],
    required: ["summary", "start_time", "end_time"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();

      let attendees: string[] = [];
      if (config.attendees) {
        try {
          attendees = JSON.parse(config.attendees as string);
        } catch {
          attendees = [];
        }
      }

      let reminders = {};
      if (config.reminders) {
        try {
          reminders = JSON.parse(config.reminders as string);
        } catch {
          reminders = { useDefault: true };
        }
      }

      return {
        success: true,
        data: {
          eventId: "abc123def456ghi789",
          summary: config.summary as string,
          description: (config.description as string) || "",
          startTime: config.start_time as string,
          endTime: config.end_time as string,
          location: (config.location as string) || "",
          timezone: (config.timezone as string) || "UTC",
          attendees,
          reminders,
          sendUpdates: (config.send_updates as string) || "all",
          htmlLink: `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(
            "abc123def456ghi789"
          )}`,
          created: timestamp,
          updated: timestamp,
          status: "confirmed",
          timestamp,
        },
        metadata: {
          nodeType: "action",
          subtype: "google_calendar_create_event",
        },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.summary) {
        errors.summary = "Event title is required";
      }

      if (!config.start_time) {
        errors.start_time = "Start time is required";
      }

      if (!config.end_time) {
        errors.end_time = "End time is required";
      }

      if (config.attendees) {
        try {
          JSON.parse(config.attendees as string);
        } catch {
          errors.attendees = "Attendees must be a valid JSON array";
        }
      }

      if (config.reminders) {
        try {
          JSON.parse(config.reminders as string);
        } catch {
          errors.reminders = "Reminders must be a valid JSON object";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
