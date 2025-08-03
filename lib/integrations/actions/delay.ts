import { createIntegration } from '../utils';
import type { Integration } from '../types';

export const delay: Integration = createIntegration({
  id: "delay",
  name: "Delay",
  category: "action",
  description: "Wait for a specified amount of time",
  icon: "clock",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "amount",
        type: "number",
        label: "Delay Amount",
        placeholder: "5",
        required: true,
      },
      {
        key: "unit",
        type: "select",
        label: "Time Unit",
        required: true,
        options: [
          { label: "Seconds", value: "seconds" },
          { label: "Minutes", value: "minutes" },
          { label: "Hours", value: "hours" },
        ],
      },
    ],
    required: ["amount", "unit"],
  },

  executor: {
    async execute(config) {
      const amount = Number(config.amount) || 1;
      const unit = config.unit as string;

      let delayMs = amount * 1000; // default to seconds
      if (unit === "minutes") delayMs = amount * 60 * 1000;
      if (unit === "hours") delayMs = amount * 60 * 60 * 1000;

      // For demo purposes, we'll just simulate the delay
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(delayMs, 2000))
      );

      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          delayAmount: amount,
          delayUnit: unit,
          actualDelayMs: delayMs,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "delay" },
      };
    },
  },
}); 