import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const sheetsAppendRow: Integration = createIntegration({
  id: "sheets_append_row",
  name: "Google Sheets Append Row",
  category: "action",
  description: "Add data to Google Sheets",
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
      },
      {
        key: "range",
        type: "text",
        label: "Range",
        placeholder: "Sheet1!A:Z",
        required: true,
      },
      {
        key: "values",
        type: "textarea",
        label: "Row Data (JSON Array)",
        placeholder: '["John", "Doe", "john@example.com", "2024-01-01"]',
        required: true,
        supportExpressions: true,
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
    ],
    required: ["spreadsheet_id", "range", "values"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();
      
      const spreadsheetId = config.spreadsheet_id as string;
      const range = config.range as string;
      const sheetName = range.split('!')[0];
      
      return {
        success: true,
        data: {
          spreadsheetId,
          range,
          updatedRange: `${sheetName}!A123:D123`,
          updatedRows: 1,
          updatedColumns: 4,
          updatedCells: 4,
          timestamp,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        },
        metadata: { nodeType: "action", subtype: "sheets_append_row" },
      };
    },
  },
}); 