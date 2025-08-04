import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper function
function validateField(
  fieldName: string,
  value: unknown,
  rule: string,
  customValidators: Record<string, string>
) {
  const result = {
    error: null as string | null,
    warning: null as string | null,
  };

  switch (rule) {
    case "required":
      if (value === undefined || value === null || value === "") {
        result.error = `Field '${fieldName}' is required`;
      }
      break;

    case "email":
      if (value && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          result.error = `Field '${fieldName}' must be a valid email address`;
        }
      }
      break;

    case "number":
      if (value !== undefined && value !== null) {
        if (typeof value !== "number" || isNaN(value)) {
          result.error = `Field '${fieldName}' must be a number`;
        }
      }
      break;

    case "string":
      if (value !== undefined && value !== null && typeof value !== "string") {
        result.error = `Field '${fieldName}' must be a string`;
      }
      break;

    case "boolean":
      if (value !== undefined && value !== null && typeof value !== "boolean") {
        result.error = `Field '${fieldName}' must be a boolean`;
      }
      break;

    case "url":
      if (value && typeof value === "string") {
        try {
          new URL(value);
        } catch {
          result.error = `Field '${fieldName}' must be a valid URL`;
        }
      }
      break;

    default:
      // Check custom validators
      if (customValidators[rule]) {
        const customRule = customValidators[rule];
        if (customRule.startsWith("regex:")) {
          const regexPattern = customRule.substring(6);
          try {
            const regex = new RegExp(regexPattern);
            if (value && typeof value === "string" && !regex.test(value)) {
              result.error = `Field '${fieldName}' failed regex validation: ${regexPattern}`;
            }
          } catch (e) {
            result.warning = `Invalid regex pattern for field '${fieldName}': ${regexPattern}`;
          }
        } else if (customRule.startsWith("range:")) {
          const range = customRule.substring(6);
          const [min, max] = range.split("-").map(Number);
          if (value && typeof value === "number") {
            if (value < min || value > max) {
              result.error = `Field '${fieldName}' must be between ${min} and ${max}`;
            }
          }
        }
      } else {
        result.warning = `Unknown validation rule '${rule}' for field '${fieldName}'`;
      }
  }

  return result;
}

export const dataValidator: Integration = createIntegration({
  id: "data_validator",
  name: "Data Validator",
  category: "logic",
  description: "Validate data against schemas and rules",
  icon: "shield-check",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "input_data",
        type: "textarea",
        label: "Data to Validate",
        placeholder: "{{$node.api-1.data.response}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "validation_rules",
        type: "textarea",
        label: "Validation Rules (JSON)",
        placeholder: '{"email": "email", "age": "number", "name": "required"}',
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string") {
            return "Validation rules must be a JSON string";
          }
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed !== "object" || parsed === null) {
              return "Validation rules must be a JSON object";
            }
            return null;
          } catch (e) {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "stop_on_error",
        type: "boolean",
        label: "Stop Workflow on Validation Error",
        required: false,
      },
      {
        key: "custom_validators",
        type: "textarea",
        label: "Custom Validators (JSON)",
        placeholder:
          '{"phone": "regex:/^\\+?[1-9]\\d{1,14}$/", "age_range": "range:18-65"}',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Custom validators must be a JSON string";
          }
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed !== "object" || parsed === null) {
              return "Custom validators must be a JSON object";
            }
            return null;
          } catch (e) {
            return "Invalid JSON format";
          }
        },
      },
    ],
    required: ["input_data", "validation_rules"],
  },

  executor: {
    async execute(config) {
      const inputData = config.input_data as unknown;
      const stopOnError = (config.stop_on_error as boolean) || false;

      let validationRules = {};
      let customValidators = {};

      try {
        validationRules = JSON.parse(config.validation_rules as string);
      } catch (e) {
        return {
          success: false,
          error: "Invalid validation rules JSON format",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "logic", subtype: "data_validator" },
        };
      }

      if (config.custom_validators) {
        try {
          customValidators = JSON.parse(config.custom_validators as string);
        } catch (e) {
          return {
            success: false,
            error: "Invalid custom validators JSON format",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "logic", subtype: "data_validator" },
          };
        }
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const validatedFields: string[] = [];

      // Validate each field according to rules
      for (const [fieldName, rule] of Object.entries(validationRules)) {
        validatedFields.push(fieldName);
        const fieldValue =
          inputData && typeof inputData === "object" && fieldName in inputData
            ? (inputData as Record<string, unknown>)[fieldName]
            : undefined;

        const validationResult = validateField(
          fieldName,
          fieldValue,
          rule as string,
          customValidators
        );

        if (validationResult.error) {
          errors.push(validationResult.error);
          if (stopOnError) break;
        }

        if (validationResult.warning) {
          warnings.push(validationResult.warning);
        }
      }

      const isValid = errors.length === 0;

      return {
        success: true,
        data: {
          is_valid: isValid,
          errors,
          warnings,
          validated_fields: validatedFields,
          total_fields: validatedFields.length,
          stop_on_error: stopOnError,
          timestamp: new Date().toISOString(),
        },
        metadata: { nodeType: "logic", subtype: "data_validator" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.input_data) {
        errors.input_data = "Input data is required";
      }

      if (!config.validation_rules) {
        errors.validation_rules = "Validation rules are required";
      } else {
        try {
          const parsed = JSON.parse(config.validation_rules as string);
          if (typeof parsed !== "object" || parsed === null) {
            errors.validation_rules = "Validation rules must be a JSON object";
          }
        } catch (e) {
          errors.validation_rules = "Invalid JSON format for validation rules";
        }
      }

      if (config.custom_validators) {
        try {
          const parsed = JSON.parse(config.custom_validators as string);
          if (typeof parsed !== "object" || parsed === null) {
            errors.custom_validators =
              "Custom validators must be a JSON object";
          }
        } catch (e) {
          errors.custom_validators =
            "Invalid JSON format for custom validators";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
