import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const databaseInsert: Integration = createIntegration({
  id: "database_insert",
  name: "Database Insert",
  category: "action",
  description: "Insert data into database tables",
  icon: "database",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "connection_string",
        type: "text",
        label: "Database Connection String",
        placeholder:
          "postgresql://user:pass@host:5432/db or mysql://user:pass@host:3306/db",
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Connection string is required";
          }
          return null;
        },
      },
      {
        key: "table_name",
        type: "text",
        label: "Table Name",
        placeholder: "users or customers",
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Table name is required";
          }
          return null;
        },
      },
      {
        key: "data",
        type: "textarea",
        label: "Data to Insert (JSON)",
        placeholder:
          '{"name": "John Doe", "email": "john@example.com", "age": 30}',
        required: true,
        supportExpressions: true,
        validation: (value: unknown) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return "Data is required";
          }
          try {
            const parsed = JSON.parse(value);
            if (
              typeof parsed !== "object" ||
              parsed === null ||
              Array.isArray(parsed)
            ) {
              return "Data must be a JSON object";
            }
            return null;
          } catch {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "return_fields",
        type: "text",
        label: "Return Fields (comma-separated)",
        placeholder: "id, created_at, updated_at",
        required: false,
      },
      {
        key: "on_conflict",
        type: "select",
        label: "On Conflict Action",
        required: false,
        options: [
          { label: "Do Nothing", value: "do_nothing" },
          { label: "Update", value: "update" },
          { label: "Error", value: "error" },
        ],
      },
      {
        key: "conflict_fields",
        type: "text",
        label: "Conflict Fields (comma-separated)",
        placeholder: "email, username",
        required: false,
      },
      {
        key: "batch_mode",
        type: "boolean",
        label: "Batch Insert Mode",
        required: false,
      },
    ],
    required: ["connection_string", "table_name", "data"],
  },

  executor: {
    async execute(config) {
      // Simulate database operation delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const connectionString = config.connection_string as string;
      const tableName = config.table_name as string;
      const returnFields = config.return_fields as string;
      const onConflict = config.on_conflict as string;
      const conflictFields = config.conflict_fields as string;
      const batchMode = (config.batch_mode as boolean) || false;

      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(config.data as string);
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          return {
            success: false,
            error: "Data must be a JSON object",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "action", subtype: "database_insert" },
          };
        }
      } catch {
        return {
          success: false,
          error: "Invalid JSON format for data",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "action", subtype: "database_insert" },
        };
      }

      // Mock database response
      const mockId = Math.floor(Math.random() * 1000000) + 1;
      const timestamp = new Date().toISOString();

      const returnedData: Record<string, unknown> = {
        id: mockId,
        ...data,
        created_at: timestamp,
        updated_at: timestamp,
      };

      // Filter returned data based on return_fields
      let finalReturnedData = returnedData;
      if (returnFields) {
        const fieldsToReturn = returnFields
          .split(",")
          .map((field) => field.trim());
        finalReturnedData = Object.fromEntries(
          Object.entries(returnedData).filter(([key]) =>
            fieldsToReturn.includes(key)
          )
        );
      }

      return {
        success: true,
        data: {
          table: tableName,
          insertedRows: 1,
          returnedData: finalReturnedData,
          allReturnedData: returnedData,
          returnFields: returnFields
            ? returnFields.split(",").map((f) => f.trim())
            : null,
          onConflict: onConflict || null,
          conflictFields: conflictFields
            ? conflictFields.split(",").map((f) => f.trim())
            : null,
          batchMode,
          executionTime: "45ms",
          timestamp,
          connectionString: connectionString.replace(/\/\/.*@/, "//***:***@"), // Mask credentials
        },
        metadata: { nodeType: "action", subtype: "database_insert" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.connection_string) {
        errors.connection_string = "Connection string is required";
      }

      if (!config.table_name) {
        errors.table_name = "Table name is required";
      }

      if (!config.data) {
        errors.data = "Data is required";
      } else {
        try {
          const parsed = JSON.parse(config.data as string);
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            errors.data = "Data must be a JSON object";
          }
        } catch {
          errors.data = "Invalid JSON format for data";
        }
      }

      if (config.on_conflict === "update" && !config.conflict_fields) {
        errors.conflict_fields =
          "Conflict fields are required when using update conflict resolution";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
