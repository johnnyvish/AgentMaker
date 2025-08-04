import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const switchCase: Integration = createIntegration({
  id: "switch_case",
  name: "Switch",
  category: "logic",
  description: "Multi-path branching based on value matching",
  icon: "git-branch",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "input_value",
        type: "text",
        label: "Input Value",
        placeholder: "{{$node.trigger-1.data.status}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "cases",
        type: "textarea",
        label: "Cases (JSON)",
        placeholder:
          '{"active": "path1", "inactive": "path2", "pending": "path3"}',
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string") {
            return "Cases must be a JSON string";
          }
          try {
            const parsed = JSON.parse(value);
            if (
              typeof parsed !== "object" ||
              parsed === null ||
              Array.isArray(parsed)
            ) {
              return "Cases must be a JSON object";
            }
            return null;
          } catch (_e) {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "default_case",
        type: "text",
        label: "Default Case",
        placeholder: "default_path",
        required: false,
      },
      {
        key: "case_sensitive",
        type: "boolean",
        label: "Case Sensitive Matching",
        required: false,
      },
    ],
    required: ["input_value", "cases"],
  },

  executor: {
    async execute(config) {
      const inputValue = config.input_value as string;
      const caseSensitive = (config.case_sensitive as boolean) || false;
      let cases = {};

      try {
        cases = JSON.parse(config.cases as string);
      } catch (_e) {
        return {
          success: false,
          error: "Invalid cases JSON format",
          data: {
            input_value: inputValue,
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "logic", subtype: "switch_case" },
        };
      }

      // Find matching case
      let matchedCase = (config.default_case as string) || "no_match";
      const availableCases = Object.keys(cases);

      for (const caseKey of availableCases) {
        const compareValue = caseSensitive ? caseKey : caseKey.toLowerCase();
        const compareInput = caseSensitive
          ? inputValue
          : inputValue.toLowerCase();

        if (compareValue === compareInput) {
          matchedCase = cases[caseKey as keyof typeof cases] as string;
          break;
        }
      }

      return {
        success: true,
        data: {
          input_value: inputValue,
          matched_case: matchedCase,
          available_cases: availableCases,
          case_sensitive: caseSensitive,
          default_case: (config.default_case as string) || "no_match",
          timestamp: new Date().toISOString(),
        },
        metadata: { nodeType: "logic", subtype: "switch_case" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.input_value) {
        errors.input_value = "Input value is required";
      }

      if (!config.cases) {
        errors.cases = "Cases configuration is required";
      } else {
        try {
          const parsed = JSON.parse(config.cases as string);
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            errors.cases = "Cases must be a JSON object";
          }
        } catch (_e) {
          errors.cases = "Invalid JSON format for cases";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
