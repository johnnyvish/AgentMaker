import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const googleSheetsAppend: Integration = createIntegration({
  id: "google_sheets_append",
  name: "Google Sheets Append",
  category: "action",
  description: "Append data to Google Sheets",
  icon: "google",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "spreadsheet_id",
        type: "text",
        label: "Spreadsheet ID",
        placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Spreadsheet ID is required";
          }
          return null;
        },
      },
      {
        key: "range",
        type: "text",
        label: "Range (Sheet Name)",
        placeholder: "Sheet1 or Sheet1!A:Z",
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Range is required";
          }
          return null;
        },
      },
      {
        key: "values",
        type: "textarea",
        label: "Data to Append (JSON Array)",
        placeholder:
          '[["John", "Doe", "john@example.com"], ["Jane", "Smith", "jane@example.com"]]',
        required: true,
        supportExpressions: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Values are required";
          }
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return "Values must be a JSON array";
            }
            return null;
          } catch (_e) {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "value_input_option",
        type: "select",
        label: "Value Input Option",
        required: false,
        options: [
          { label: "Raw", value: "RAW" },
          { label: "User Entered", value: "USER_ENTERED" },
        ],
      },
      {
        key: "insert_data_option",
        type: "select",
        label: "Insert Data Option",
        required: false,
        options: [
          { label: "Insert Rows", value: "INSERT_ROWS" },
          { label: "Overwrite", value: "OVERWRITE" },
        ],
      },
      {
        key: "include_values_in_response",
        type: "boolean",
        label: "Include Values in Response",
        required: false,
      },
    ],
    required: ["spreadsheet_id", "range", "values"],
  },

  executor: {
    async execute(config) {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const spreadsheetId = config.spreadsheet_id as string;
      const range = config.range as string;
      const valueInputOption = (config.value_input_option as string) || "RAW";
      const insertDataOption = config.insert_data_option as string;
      const includeValuesInResponse =
        (config.include_values_in_response as boolean) || false;

      let values: unknown[][] = [];
      try {
        values = JSON.parse(config.values as string);
        if (!Array.isArray(values)) {
          return {
            success: false,
            error: "Values must be a JSON array",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "action", subtype: "google_sheets_append" },
          };
        }
      } catch (_e) {
        return {
          success: false,
          error: "Invalid JSON format for values",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "action", subtype: "google_sheets_append" },
        };
      }

      // Extract sheet name from range
      const sheetName = range.includes("!") ? range.split("!")[0] : range;

      // Calculate the updated range
      const rowCount = values.length;
      const colCount = values[0]?.length || 0;
      const startRow = Math.floor(Math.random() * 100) + 1; // Mock starting row
      const endRow = startRow + rowCount - 1;
      const startCol = "A";
      const endCol = String.fromCharCode(65 + colCount - 1); // Convert number to letter
      const updatedRange = `${sheetName}!${startCol}${startRow}:${endCol}${endRow}`;

      return {
        success: true,
        data: {
          spreadsheetId,
          tableRange: range,
          updates: {
            spreadsheetId,
            updatedRange,
            updatedRows: rowCount,
            updatedColumns: colCount,
            updatedCells: rowCount * colCount,
            updatedData: includeValuesInResponse ? values : undefined,
          },
          valueInputOption,
          insertDataOption: insertDataOption || null,
          includeValuesInResponse,
          timestamp: new Date().toISOString(),
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        },
        metadata: { nodeType: "action", subtype: "google_sheets_append" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.spreadsheet_id) {
        errors.spreadsheet_id = "Spreadsheet ID is required";
      }

      if (!config.range) {
        errors.range = "Range is required";
      }

      if (!config.values) {
        errors.values = "Values are required";
      } else {
        try {
          const parsed = JSON.parse(config.values as string);
          if (!Array.isArray(parsed)) {
            errors.values = "Values must be a JSON array";
          }
        } catch (_e) {
          errors.values = "Invalid JSON format for values";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
