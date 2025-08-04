import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const calendlyCreateBooking: Integration = createIntegration({
  id: "calendly_create_booking",
  name: "Calendly Create Booking",
  category: "action",
  description: "Create booking links, manage appointments, handle scheduling",
  icon: "calendar",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "event_type_uri",
        type: "text",
        label: "Event Type URI",
        placeholder: "https://api.calendly.com/event_types/ABC123",
        required: true,
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
        key: "invitee_name",
        type: "text",
        label: "Invitee Name",
        placeholder: "John Doe",
        required: true,
        supportExpressions: true,
      },
      {
        key: "invitee_email",
        type: "email",
        label: "Invitee Email",
        placeholder: "john@example.com",
        required: true,
        supportExpressions: true,
      },
      {
        key: "invitee_questions",
        type: "textarea",
        label: "Invitee Questions (JSON)",
        placeholder:
          '{"1_question_1": "What is your company size?", "1_answer_1": "10-50 employees"}',
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
        key: "location_type",
        type: "select",
        label: "Location Type",
        required: false,
        options: [
          { label: "Google Meet", value: "google_meet" },
          { label: "Zoom", value: "zoom" },
          { label: "Microsoft Teams", value: "microsoft_teams" },
          { label: "In Person", value: "physical" },
          { label: "Phone Call", value: "phone" },
        ],
      },
      {
        key: "location",
        type: "text",
        label: "Location",
        placeholder: "Conference Room A or meeting link",
        required: false,
        supportExpressions: true,
      },
    ],
    required: [
      "event_type_uri",
      "start_time",
      "end_time",
      "invitee_name",
      "invitee_email",
    ],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();

      let inviteeQuestions = {};
      if (config.invitee_questions) {
        try {
          inviteeQuestions = JSON.parse(config.invitee_questions as string);
        } catch {
          inviteeQuestions = {};
        }
      }

      const bookingId = `cal_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          bookingId,
          eventTypeUri: config.event_type_uri as string,
          startTime: config.start_time as string,
          endTime: config.end_time as string,
          inviteeName: config.invitee_name as string,
          inviteeEmail: config.invitee_email as string,
          inviteeQuestions,
          timezone: (config.timezone as string) || "UTC",
          locationType: (config.location_type as string) || "google_meet",
          location: (config.location as string) || "",
          status: "active",
          cancelUrl: `https://calendly.com/cancellations/${bookingId}`,
          rescheduleUrl: `https://calendly.com/reschedule/${bookingId}`,
          createdAt: timestamp,
          updatedAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "calendly_create_booking" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.event_type_uri) {
        errors.event_type_uri = "Event type URI is required";
      }

      if (!config.start_time) {
        errors.start_time = "Start time is required";
      }

      if (!config.end_time) {
        errors.end_time = "End time is required";
      }

      if (!config.invitee_name) {
        errors.invitee_name = "Invitee name is required";
      }

      if (!config.invitee_email) {
        errors.invitee_email = "Invitee email is required";
      }

      if (config.invitee_questions) {
        try {
          JSON.parse(config.invitee_questions as string);
        } catch {
          errors.invitee_questions =
            "Invitee questions must be a valid JSON object";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
