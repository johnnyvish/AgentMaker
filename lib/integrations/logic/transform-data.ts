import { createIntegration } from "../utils";
import { parseExpression } from "../../expression";
import type { Integration, WorkflowContext } from "../types";

export const transformData: Integration = createIntegration({
  id: "transform_data",
  name: "Transform Data",
  category: "logic",
  description: "Transform and format data",
  icon: "zap",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "inputData",
        type: "textarea",
        label: "Input Data",
        placeholder: "{{$node.previous-node.data}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "transformation",
        type: "select",
        label: "Transformation Type",
        required: true,
        options: [
          { label: "Format JSON", value: "format_json" },
          { label: "Extract Field", value: "extract_field" },
          { label: "Convert to String", value: "to_string" },
          { label: "Convert to Number", value: "to_number" },
        ],
      },
      {
        key: "fieldPath",
        type: "text",
        label: "Field Path (for extraction)",
        placeholder: "{{$node.webhook-1.data.user.email}}",
        required: false,
      },
    ],
    required: ["inputData", "transformation"],
  },

  executor: {
    async execute(config, context: WorkflowContext) {
      // Fix 1: Properly interpolate the inputData expression
      const inputData = parseExpression(config.inputData as string, context);
      const transformation = config.transformation as string;
      const timestamp = new Date().toISOString();

      let result;
      switch (transformation) {
        case "format_json":
          result = JSON.stringify(inputData, null, 2);
          break;
        case "extract_field":
          // Fix 2: Also interpolate field path
          const fieldPath = parseExpression(config.fieldPath as string, context);
          result = `Extracted: ${fieldPath}`;
          break;
        case "to_string":
          result = String(inputData);
          break;
        case "to_number":
          result = Number(inputData) || 0;
          break;
        default:
          result = inputData;
      }

      return {
        success: true,
        data: {
          input: inputData,
          transformation,
          result,
          timestamp,
        },
        metadata: { nodeType: "logic", subtype: "transform_data" },
      };
    },
  },
});
