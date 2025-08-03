import { createIntegration } from '../utils';
import type { Integration } from '../types';

export const manualTrigger: Integration = createIntegration({
  id: "manual_trigger",
  name: "Manual",
  category: "trigger",
  description: "Trigger manually",
  icon: "hand",
  version: "1.0.0",

  hasInputHandle: false,

  schema: {
    fields: [
      {
        key: "triggerName",
        type: "text",
        label: "Trigger Name",
        placeholder: "My Manual Trigger",
        required: false,
      },
    ],
    required: [],
  },

  executor: {
    async execute(config) {
      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          triggered: true,
          timestamp,
          triggerName: (config.triggerName as string) || "Manual Trigger",
        },
        metadata: { nodeType: "trigger", subtype: "manual_trigger" },
      };
    },
  },
}); 