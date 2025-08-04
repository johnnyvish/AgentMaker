import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const zoomCreateMeeting: Integration = createIntegration({
  id: "zoom_create_meeting",
  name: "Zoom Create Meeting",
  category: "action",
  description: "Schedule Zoom meetings",
  icon: "zoom",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "topic",
        type: "text",
        label: "Meeting Topic",
        placeholder: "Team Standup",
        required: true,
        supportExpressions: true,
      },
      {
        key: "start_time",
        type: "text",
        label: "Start Time",
        placeholder: "2024-12-01T10:00:00Z",
        required: true,
      },
      {
        key: "duration",
        type: "number",
        label: "Duration (minutes)",
        placeholder: "30",
        required: false,
      },
      {
        key: "password",
        type: "text",
        label: "Meeting Password",
        placeholder: "123456",
        required: false,
      },
      {
        key: "settings",
        type: "textarea",
        label: "Settings (JSON)",
        placeholder:
          '{"host_video": true, "participant_video": true, "join_before_host": true}',
        required: false,
      },
    ],
    required: ["topic", "start_time"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          meetingId: 123456789,
          topic: config.topic as string,
          startTime: config.start_time as string,
          duration: (config.duration as number) || 30,
          password: (config.password as string) || "",
          settings: config.settings
            ? JSON.parse(config.settings as string)
            : {},
          joinUrl: "https://zoom.us/j/123456789?pwd=abc123def456",
          startUrl: "https://zoom.us/s/123456789?zak=abc123def456",
          createdAt: timestamp,
          hostEmail: "host@example.com",
          status: "waiting",
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "zoom_create_meeting" },
      };
    },
  },
});
