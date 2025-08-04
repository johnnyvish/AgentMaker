import { createIntegration } from "../utils";
import type { Integration, WorkflowContext } from "../types";
import { parseExpression } from "../../expression";

export const branchCondition: Integration = createIntegration({
  id: "branch_condition",
  name: "Branch",
  category: "logic",
  description: "Split workflow into multiple paths",
  icon: "diamond",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "condition",
        type: "textarea",
        label: "Condition Expression",
        placeholder: "{{$node.trigger-1.data.status}} === 'active'",
        required: true,
        supportExpressions: true,
      },
      {
        key: "trueLabel",
        type: "text",
        label: "True Path Label",
        placeholder: "If condition is true",
        required: false,
      },
      {
        key: "falseLabel",
        type: "text",
        label: "False Path Label",
        placeholder: "If condition is false",
        required: false,
      },
    ],
    required: ["condition"],
  },

  executor: {
    async execute(config, ctx: WorkflowContext) {
      // The condition should already be interpolated by the registry
      const condition = config.condition as string;

      // Parse the condition to replace variables
      const interpolatedCondition = parseExpression(condition, ctx, true);

      let conditionResult = false;
      try {
        conditionResult = Function(
          `"use strict"; return (${interpolatedCondition});`
        )();
      } catch (error) {
        console.warn("Branch condition evaluation failed:", error);
      }

      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          condition: interpolatedCondition, // Show the actual evaluated condition
          result: conditionResult,
          path: conditionResult ? "true" : "false",
          timestamp,
        },
        metadata: { nodeType: "logic", subtype: "branch_condition" },
      };
    },
  },
});
