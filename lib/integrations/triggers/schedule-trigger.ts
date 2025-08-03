import { createIntegration } from '../utils';
import type { Integration } from '../types';

export const scheduleTrigger: Integration = createIntegration({
  id: "schedule_trigger",
  name: "Schedule",
  category: "trigger",
  description: "Run on a schedule",
  icon: "clock",
  version: "1.0.0",

  hasInputHandle: false,

  schema: {
    fields: [
      {
        key: "schedule",
        type: "select",
        label: "Schedule",
        required: true,
        options: [
          { label: "Every minute", value: "* * * * *" },
          { label: "Every hour", value: "0 * * * *" },
          { label: "Every day", value: "0 0 * * *" },
          { label: "Every week", value: "0 0 * * 0" },
        ],
      },
      {
        key: "timezone",
        type: "select",
        label: "Timezone",
        required: false,
        options: [
          { label: "UTC", value: "UTC" },
          { label: "America/New_York", value: "America/New_York" },
          { label: "America/Los_Angeles", value: "America/Los_Angeles" },
        ],
      },
    ],
    required: ["schedule"],
  },

  executor: {
    async execute(config) {
      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          schedule: config.schedule as string,
          timezone: (config.timezone as string) || "UTC",
          timestamp,
        },
        metadata: { nodeType: "trigger", subtype: "schedule_trigger" },
      };
    },
  },
}); 