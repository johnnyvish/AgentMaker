import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const csvParser: Integration = createIntegration({
  id: "csv_parser",
  name: "CSV Parser",
  category: "action",
  description: "Parse CSV files, extract specific columns, filter rows",
  icon: "file-text",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "csv_content",
        type: "textarea",
        label: "CSV Content",
        placeholder:
          "name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25",
        required: true,
        supportExpressions: true,
      },
      {
        key: "delimiter",
        type: "text",
        label: "Delimiter",
        placeholder: ",",
        required: false,
      },
      {
        key: "has_header",
        type: "boolean",
        label: "Has Header Row",
        required: false,
      },
      {
        key: "columns_to_extract",
        type: "text",
        label: "Columns to Extract (comma-separated)",
        placeholder: "name,email",
        required: false,
      },
      {
        key: "filter_condition",
        type: "textarea",
        label: "Filter Condition (JSON)",
        placeholder: '{"age": {"$gte": 25}, "status": "active"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "skip_empty_rows",
        type: "boolean",
        label: "Skip Empty Rows",
        required: false,
      },
      {
        key: "max_rows",
        type: "number",
        label: "Maximum Rows to Process",
        placeholder: "1000",
        required: false,
      },
      {
        key: "output_format",
        type: "select",
        label: "Output Format",
        required: false,
        options: [
          { label: "JSON Array", value: "json" },
          { label: "CSV String", value: "csv" },
          { label: "Object with Headers", value: "object" },
        ],
      },
    ],
    required: ["csv_content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();

      const csvContent = config.csv_content as string;
      const delimiter = (config.delimiter as string) || ",";
      const hasHeader = (config.has_header as boolean) !== false;
      const skipEmptyRows = (config.skip_empty_rows as boolean) || false;
      const maxRows = (config.max_rows as number) || 1000;
      const outputFormat = (config.output_format as string) || "json";

      // Parse CSV content
      const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
      const rows = lines.slice(hasHeader ? 1 : 0).slice(0, maxRows);

      let headers: string[] = [];
      if (hasHeader && lines.length > 0) {
        headers = lines[0].split(delimiter).map((h) => h.trim());
      } else {
        // Generate default headers
        const firstRow = rows[0]?.split(delimiter) || [];
        headers = firstRow.map((_, index) => `column_${index + 1}`);
      }

      // Parse rows
      const parsedRows = rows
        .filter((row) => !skipEmptyRows || row.trim() !== "")
        .map((row) => {
          const values = row.split(delimiter);
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });
          return rowData;
        });

      // Apply column filtering
      let filteredRows = parsedRows;
      if (config.columns_to_extract) {
        const columnsToExtract = (config.columns_to_extract as string)
          .split(",")
          .map((col) => col.trim());

        filteredRows = parsedRows.map((row) => {
          const filteredRow: Record<string, string> = {};
          columnsToExtract.forEach((col) => {
            if (row[col] !== undefined) {
              filteredRow[col] = row[col];
            }
          });
          return filteredRow;
        });
      }

      // Apply filter conditions
      if (config.filter_condition) {
        try {
          const filterCondition = JSON.parse(config.filter_condition as string);
          filteredRows = filteredRows.filter((row) => {
            for (const [field, condition] of Object.entries(filterCondition)) {
              const value = row[field];

              if (typeof condition === "object" && condition !== null) {
                for (const [operator, operatorValue] of Object.entries(
                  condition
                )) {
                  switch (operator) {
                    case "$eq":
                      if (value !== operatorValue) return false;
                      break;
                    case "$ne":
                      if (value === operatorValue) return false;
                      break;
                    case "$gt":
                      if (Number(value) <= Number(operatorValue)) return false;
                      break;
                    case "$gte":
                      if (Number(value) < Number(operatorValue)) return false;
                      break;
                    case "$lt":
                      if (Number(value) >= Number(operatorValue)) return false;
                      break;
                    case "$lte":
                      if (Number(value) > Number(operatorValue)) return false;
                      break;
                    case "$in":
                      if (
                        !Array.isArray(operatorValue) ||
                        !operatorValue.includes(value)
                      )
                        return false;
                      break;
                    case "$like":
                      if (!value.includes(operatorValue as string))
                        return false;
                      break;
                  }
                }
              } else {
                if (value !== condition) return false;
              }
            }
            return true;
          });
        } catch {
          // Invalid filter condition, use all rows
        }
      }

      // Format output - note: output variable is used for future extensibility
      let output: unknown;
      switch (outputFormat) {
        case "csv":
          const outputHeaders = config.columns_to_extract
            ? (config.columns_to_extract as string)
                .split(",")
                .map((col) => col.trim())
            : headers;
          output = [
            outputHeaders.join(delimiter),
            ...filteredRows.map((row) =>
              outputHeaders.map((header) => row[header] || "").join(delimiter)
            ),
          ].join("\n");
          break;
        case "object":
          output = {
            headers,
            rows: filteredRows,
            totalRows: filteredRows.length,
            originalRows: parsedRows.length,
          };
          break;
        default:
          output = filteredRows;
      }

      return {
        success: true,
        data: {
          parsedRows: filteredRows,
          totalRows: filteredRows.length,
          originalRows: parsedRows.length,
          headers,
          delimiter,
          hasHeader,
          columnsExtracted: config.columns_to_extract
            ? (config.columns_to_extract as string)
                .split(",")
                .map((col) => col.trim())
            : null,
          filterApplied: !!config.filter_condition,
          outputFormat,
          output,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "csv_parser" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.csv_content) {
        errors.csv_content = "CSV content is required";
      }

      if (config.filter_condition) {
        try {
          JSON.parse(config.filter_condition as string);
        } catch {
          errors.filter_condition =
            "Filter condition must be a valid JSON object";
        }
      }

      if (
        config.max_rows &&
        (typeof config.max_rows !== "number" || config.max_rows <= 0)
      ) {
        errors.max_rows = "Maximum rows must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
