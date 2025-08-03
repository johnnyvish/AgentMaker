import { createIntegration } from "../utils";
import type { Integration, ValidationResult, WorkflowContext } from "../types";

export const setVariable: Integration = createIntegration({
  id: "set_variable",
  name: "Set Variable",
  category: "action",
  description: "Store data in a variable",
  icon: "database",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "variableName",
        type: "text",
        label: "Variable Name",
        placeholder: "myVariable",
        required: true,
        validation: (value: unknown) => {
          if (
            typeof value !== "string" ||
            !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
          ) {
            return "Variable name must start with letter or underscore and contain only letters, numbers, and underscores";
          }
          return null;
        },
      },
      {
        key: "value",
        type: "textarea",
        label: "Value",
        placeholder: "Enter value or reference data...",
        required: true,
        supportExpressions: true,
      },
    ],
    required: ["variableName", "value"],
  },

  executor: {
    async execute(config, context: WorkflowContext) {
      if (config.variableName) {
        let val: unknown = config.value;
        /* If user pasted JSON, keep it as an object so {{$vars.x.y}} works */
        if (typeof val === "string") {
          try {
            val = JSON.parse(val);
          } catch {
            /* ignore */
          }
        }
        context.variables[config.variableName as string] = val;
      }

      const timestamp = new Date().toISOString();
      return {
        success: true,
        data: {
          variableName: config.variableName as string,
          value: config.value,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "set_variable" },
      };
    },

    validate(config): ValidationResult {
      const errors: Record<string, string> = {};

      if (!config.variableName) {
        errors.variableName = "Variable name is required";
      } else if (
        !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.variableName as string)
      ) {
        errors.variableName = "Invalid variable name format";
      }

      if (!config.value) {
        errors.value = "Value is required";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
