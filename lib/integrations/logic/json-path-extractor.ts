import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const jsonPathExtractor: Integration = createIntegration({
  id: "json_path_extractor",
  name: "JSON Path Extractor",
  category: "logic",
  description: "Extract specific values from complex JSON using JSONPath",
  icon: "search",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "json_data",
        type: "textarea",
        label: "JSON Data",
        placeholder:
          '{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]}',
        required: true,
        supportExpressions: true,
      },
      {
        key: "json_path",
        type: "text",
        label: "JSONPath Expression",
        placeholder: "$.users[*].name",
        required: true,
        supportExpressions: true,
      },
      {
        key: "extraction_mode",
        type: "select",
        label: "Extraction Mode",
        required: false,
        options: [
          { label: "Single Value", value: "single" },
          { label: "Multiple Values", value: "multiple" },
          { label: "All Matches", value: "all" },
        ],
      },
      {
        key: "output_format",
        type: "select",
        label: "Output Format",
        required: false,
        options: [
          { label: "JSON", value: "json" },
          { label: "Array", value: "array" },
          { label: "String", value: "string" },
          { label: "Number", value: "number" },
          { label: "Boolean", value: "boolean" },
        ],
      },
      {
        key: "default_value",
        type: "text",
        label: "Default Value",
        placeholder: "null or empty string",
        required: false,
        supportExpressions: true,
      },
      {
        key: "flatten_results",
        type: "boolean",
        label: "Flatten Results",
        required: false,
      },
      {
        key: "case_sensitive",
        type: "boolean",
        label: "Case Sensitive",
        required: false,
      },
      {
        key: "max_results",
        type: "number",
        label: "Maximum Results",
        placeholder: "100",
        required: false,
      },
    ],
    required: ["json_data", "json_path"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const timestamp = new Date().toISOString();

      const jsonData = config.json_data as string;
      const jsonPath = config.json_path as string;
      const extractionMode = (config.extraction_mode as string) || "multiple";
      const outputFormat = (config.output_format as string) || "json";
      const defaultValue = (config.default_value as string) || null;
      const flattenResults = (config.flatten_results as boolean) || false;
      const caseSensitive = (config.case_sensitive as boolean) !== false;
      const maxResults = (config.max_results as number) || 100;

      let parsedData: unknown = null;
      try {
        parsedData = JSON.parse(jsonData);
      } catch {
        return {
          success: false,
          error: "Invalid JSON data",
          data: {
            timestamp,
          },
          metadata: { nodeType: "logic", subtype: "json_path_extractor" },
        };
      }

      // Mock JSONPath extraction
      const extractedValues = this.mockJsonPathExtract(parsedData, jsonPath, {
        extractionMode,
        maxResults,
        caseSensitive,
      });

      // Apply output formatting
      let formattedResult = extractedValues;
      switch (outputFormat) {
        case "array":
          formattedResult = Array.isArray(extractedValues)
            ? extractedValues
            : [extractedValues];
          break;
        case "string":
          formattedResult = Array.isArray(extractedValues)
            ? extractedValues.join(", ")
            : String(extractedValues);
          break;
        case "number":
          formattedResult = Array.isArray(extractedValues)
            ? extractedValues.map((v) => Number(v)).filter((n) => !isNaN(n))
            : Number(extractedValues);
          break;
        case "boolean":
          formattedResult = Array.isArray(extractedValues)
            ? extractedValues.map((v) => Boolean(v))
            : Boolean(extractedValues);
          break;
      }

      // Flatten results if requested
      if (flattenResults && Array.isArray(formattedResult)) {
        formattedResult = this.flattenArray(formattedResult);
      }

      const extractorId = `jsonpath_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          extractorId,
          jsonPath,
          extractionMode,
          outputFormat,
          defaultValue,
          flattenResults,
          caseSensitive,
          maxResults,
          originalData: parsedData,
          extractedValues,
          formattedResult,
          resultCount: Array.isArray(formattedResult)
            ? formattedResult.length
            : 1,
          hasResults: Array.isArray(formattedResult)
            ? formattedResult.length > 0
            : !!formattedResult,
          timestamp,
        },
        metadata: { nodeType: "logic", subtype: "json_path_extractor" },
      };
    },

    mockJsonPathExtract(
      data: unknown,
      path: string,
      options: {
        extractionMode: string;
        maxResults: number;
        caseSensitive: boolean;
      }
    ): unknown {
      // Simple mock implementation for common JSONPath patterns
      const pathLower = path.toLowerCase();

      if (pathLower.includes("$.") && pathLower.includes("[*]")) {
        // Array extraction pattern
        const parts = path.split("[*]");
        if (parts.length >= 2) {
          const field = parts[1].replace(/[^a-zA-Z0-9_]/g, "");
          if (Array.isArray(data)) {
            return data
              .slice(0, options.maxResults)
              .map((item) =>
                typeof item === "object" && item
                  ? (item as Record<string, unknown>)[field]
                  : null
              )
              .filter((v) => v !== null);
          }
        }
      }

      if (pathLower.includes("$.") && !pathLower.includes("[*]")) {
        // Single field extraction
        const field = path.replace("$.", "").replace(/[^a-zA-Z0-9_]/g, "");
        if (typeof data === "object" && data) {
          return (data as Record<string, unknown>)[field];
        }
      }

      if (pathLower === "$") {
        // Root object
        return data;
      }

      // Default mock response
      return ["mock_value_1", "mock_value_2", "mock_value_3"].slice(
        0,
        options.maxResults
      );
    },

    flattenArray(arr: unknown[]): unknown[] {
      const result: unknown[] = [];
      for (const item of arr) {
        if (Array.isArray(item)) {
          result.push(...this.flattenArray(item));
        } else {
          result.push(item);
        }
      }
      return result;
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.json_data) {
        errors.json_data = "JSON data is required";
      } else {
        try {
          JSON.parse(config.json_data as string);
        } catch {
          errors.json_data = "Invalid JSON format";
        }
      }

      if (!config.json_path) {
        errors.json_path = "JSONPath expression is required";
      }

      if (
        config.max_results &&
        (typeof config.max_results !== "number" || config.max_results <= 0)
      ) {
        errors.max_results = "Maximum results must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
