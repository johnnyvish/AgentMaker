import { createIntegration } from "../utils";
import type { Integration, WorkflowContext } from "../types";

export const iteratorLoop: Integration = createIntegration({
  id: "iterator_loop",
  name: "Iterator",
  category: "logic",
  description: "Loop through arrays and process each item",
  icon: "repeat",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "array",
        type: "textarea",
        label: "Array to Iterate",
        placeholder: "{{$node.api-1.data.response.items}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "item_variable",
        type: "text",
        label: "Item Variable Name",
        placeholder: "current_item",
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
        key: "index_variable",
        type: "text",
        label: "Index Variable Name",
        placeholder: "current_index",
        required: false,
        validation: (value: unknown) => {
          if (
            value &&
            (typeof value !== "string" ||
              !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value))
          ) {
            return "Variable name must start with letter or underscore and contain only letters, numbers, and underscores";
          }
          return null;
        },
      },
      {
        key: "max_iterations",
        type: "number",
        label: "Max Iterations (safety limit)",
        placeholder: "1000",
        required: false,
      },
    ],
    required: ["array", "item_variable"],
  },

  executor: {
    async execute(config, context: WorkflowContext) {
      const array = config.array as unknown;
      const itemVarName = config.item_variable as string;
      const indexVarName = config.index_variable as string;
      const maxIterations = (config.max_iterations as number) || 1000;

      // Ensure we have an array to iterate
      if (!Array.isArray(array)) {
        return {
          success: false,
          error: "Input is not an array",
          data: {
            input_type: typeof array,
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "logic", subtype: "iterator_loop" },
        };
      }

      const results = [];
      const actualArray = array.slice(0, maxIterations); // Respect max iterations limit

      for (let i = 0; i < actualArray.length; i++) {
        const item = actualArray[i];

        // Set variables in context for this iteration
        context.variables[itemVarName] = item;
        if (indexVarName) {
          context.variables[indexVarName] = i;
        }

        results.push({
          index: i,
          item: item,
          processed_at: new Date().toISOString(),
          variables_set: {
            [itemVarName]: item,
            ...(indexVarName && { [indexVarName]: i }),
          },
        });
      }

      return {
        success: true,
        data: {
          total_items: array.length,
          processed_items: actualArray.length,
          results,
          completed_iterations: actualArray.length,
          max_iterations_limit: maxIterations,
          timestamp: new Date().toISOString(),
        },
        metadata: { nodeType: "logic", subtype: "iterator_loop" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.array) {
        errors.array = "Array to iterate is required";
      }

      if (!config.item_variable) {
        errors.item_variable = "Item variable name is required";
      } else if (
        !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.item_variable as string)
      ) {
        errors.item_variable = "Invalid variable name format";
      }

      if (
        config.index_variable &&
        !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.index_variable as string)
      ) {
        errors.index_variable = "Invalid variable name format";
      }

      if (
        config.max_iterations &&
        (typeof config.max_iterations !== "number" ||
          config.max_iterations <= 0)
      ) {
        errors.max_iterations = "Max iterations must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
