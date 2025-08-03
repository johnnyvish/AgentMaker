import { createIntegration } from '../utils';
import type { Integration } from '../types';

export const filterCondition: Integration = createIntegration({
  id: "filter_condition",
  name: "Filter",
  category: "logic",
  description: "Filter data conditionally",
  icon: "search",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "field",
        type: "text",
        label: "Field to Check",
        placeholder: "{{$node.webhook-1.data.status}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "operator",
        type: "select",
        label: "Condition",
        required: true,
        options: [
          { label: "equals", value: "equals" },
          { label: "does not equal", value: "not_equals" },
          { label: "contains", value: "contains" },
          { label: "is greater than", value: "greater_than" },
          { label: "is less than", value: "less_than" },
        ],
      },
      {
        key: "value",
        type: "text",
        label: "Comparison Value",
        placeholder: "active",
        required: true,
        supportExpressions: true,
      },
    ],
    required: ["field", "operator", "value"],
  },

  executor: {
    async execute(config) {
      const sampleValue = "active"; // Simulate checking a status field
      const conditionMet = sampleValue === config.value;
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          field: config.field as string,
          operator: config.operator as string,
          expectedValue: config.value,
          actualValue: sampleValue,
          conditionMet,
          matchedRecords: conditionMet ? 42 : 0,
          timestamp,
        },
        metadata: { nodeType: "logic", subtype: "filter_condition" },
      };
    },
  },
}); 