import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const postgresInsert: Integration = createIntegration({
  id: "postgres_insert",
  name: "PostgreSQL Insert",
  category: "action",
  description: "Insert records into PostgreSQL database",
  icon: "postgresql",
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
        label: "Connection String",
        placeholder: "postgresql://user:pass@host:5432/db",
        required: true,
      },
      {
        key: "table",
        type: "text",
        label: "Table Name",
        placeholder: "users",
        required: true,
      },
      {
        key: "data",
        type: "textarea",
        label: "Data (JSON)",
        placeholder: '{"name": "John", "email": "john@example.com"}',
        required: true,
        supportExpressions: true,
      },
      {
        key: "return_fields",
        type: "text",
        label: "Return Fields",
        placeholder: "id, created_at",
        required: false,
      },
    ],
    required: ["connection_string", "table", "data"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          table: config.table as string,
          insertedRows: 1,
          returnedData: {
            id: 12345,
            name: "John Doe",
            email: "john@example.com",
            created_at: timestamp,
          },
          executionTime: "45ms",
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "postgres_insert" },
      };
    },
  },
});
