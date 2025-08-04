import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper function
function matchesWhereConditions(
  row: Record<string, unknown>,
  conditions: Record<string, unknown>
): boolean {
  for (const [field, condition] of Object.entries(conditions)) {
    const value = row[field];

    if (typeof condition === "object" && condition !== null) {
      // Handle operators like {"$gte": 18}
      for (const [operator, operatorValue] of Object.entries(condition)) {
        switch (operator) {
          case "$eq":
            if (value !== operatorValue) return false;
            break;
          case "$ne":
            if (value === operatorValue) return false;
            break;
          case "$gt":
            if (typeof value !== "number" || value <= operatorValue)
              return false;
            break;
          case "$gte":
            if (typeof value !== "number" || value < operatorValue)
              return false;
            break;
          case "$lt":
            if (typeof value !== "number" || value >= operatorValue)
              return false;
            break;
          case "$lte":
            if (typeof value !== "number" || value > operatorValue)
              return false;
            break;
          case "$in":
            if (!Array.isArray(operatorValue) || !operatorValue.includes(value))
              return false;
            break;
          case "$nin":
            if (Array.isArray(operatorValue) && operatorValue.includes(value))
              return false;
            break;
          case "$like":
            if (
              typeof value !== "string" ||
              !value.includes(operatorValue as string)
            )
              return false;
            break;
        }
      }
    } else {
      // Simple equality check
      if (value !== condition) return false;
    }
  }

  return true;
}

export const databaseSelect: Integration = createIntegration({
  id: "database_select",
  name: "Database Select",
  category: "action",
  description: "Query data from database tables",
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
        key: "query_type",
        type: "select",
        label: "Query Type",
        required: true,
        options: [
          { label: "SQL Query", value: "sql" },
          { label: "Table Select", value: "table" },
        ],
      },
      {
        key: "sql_query",
        type: "textarea",
        label: "SQL Query",
        placeholder:
          "SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 10",
        required: false,
        supportExpressions: true,
      },
      {
        key: "table_name",
        type: "text",
        label: "Table Name",
        placeholder: "users or customers",
        required: false,
      },
      {
        key: "select_fields",
        type: "text",
        label: "Select Fields (comma-separated)",
        placeholder: "id, name, email, created_at",
        required: false,
      },
      {
        key: "where_conditions",
        type: "textarea",
        label: "Where Conditions (JSON)",
        placeholder: '{"status": "active", "age": {"$gte": 18}}',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Where conditions must be a JSON string";
          }
          try {
            JSON.parse(value);
            return null;
          } catch {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "order_by",
        type: "text",
        label: "Order By",
        placeholder: "created_at DESC, name ASC",
        required: false,
      },
      {
        key: "limit",
        type: "number",
        label: "Limit",
        placeholder: "100",
        required: false,
      },
      {
        key: "offset",
        type: "number",
        label: "Offset",
        placeholder: "0",
        required: false,
      },
    ],
    required: ["connection_string", "query_type"],
  },

  executor: {
    async execute(config) {
      // Simulate database operation delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const connectionString = config.connection_string as string;
      const queryType = config.query_type as string;
      const sqlQuery = config.sql_query as string;
      const tableName = config.table_name as string;
      const selectFields = config.select_fields as string;
      const orderBy = config.order_by as string;
      const limit = (config.limit as number) || 100;
      const offset = (config.offset as number) || 0;

      let whereConditions = {};
      if (config.where_conditions) {
        try {
          whereConditions = JSON.parse(config.where_conditions as string);
        } catch {
          return {
            success: false,
            error: "Invalid JSON format for where conditions",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "action", subtype: "database_select" },
          };
        }
      }

      // Validate required fields based on query type
      if (queryType === "sql" && !sqlQuery) {
        return {
          success: false,
          error: "SQL query is required when using SQL query type",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "action", subtype: "database_select" },
        };
      }

      if (queryType === "table" && !tableName) {
        return {
          success: false,
          error: "Table name is required when using table select type",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "action", subtype: "database_select" },
        };
      }

      // Mock database response
      const mockData = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          status: "active",
          age: 30,
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          status: "active",
          age: 25,
          created_at: "2024-01-14T15:45:00Z",
          updated_at: "2024-01-14T15:45:00Z",
        },
        {
          id: 3,
          name: "Bob Johnson",
          email: "bob@example.com",
          status: "inactive",
          age: 35,
          created_at: "2024-01-13T09:20:00Z",
          updated_at: "2024-01-13T09:20:00Z",
        },
      ];

      // Apply where conditions filtering
      let filteredData = mockData;
      if (Object.keys(whereConditions).length > 0) {
        filteredData = mockData.filter((row) => {
          return matchesWhereConditions(row, whereConditions);
        });
      }

      // Apply limit and offset
      const paginatedData = filteredData.slice(offset, offset + limit);

      // Filter fields if specified
      let finalData: Record<string, unknown>[] = paginatedData;
      if (selectFields && queryType === "table") {
        const fieldsToSelect = selectFields
          .split(",")
          .map((field) => field.trim());
        finalData = paginatedData.map((row) => {
          const filteredRow: Record<string, unknown> = {};
          for (const field of fieldsToSelect) {
            if (field in row) {
              filteredRow[field] = row[field as keyof typeof row];
            }
          }
          return filteredRow;
        });
      }

      return {
        success: true,
        data: {
          queryType,
          sqlQuery: queryType === "sql" ? sqlQuery : null,
          tableName: queryType === "table" ? tableName : null,
          selectFields: selectFields
            ? selectFields.split(",").map((f) => f.trim())
            : null,
          whereConditions:
            Object.keys(whereConditions).length > 0 ? whereConditions : null,
          orderBy: orderBy || null,
          limit,
          offset,
          results: finalData,
          totalRows: filteredData.length,
          returnedRows: finalData.length,
          executionTime: "23ms",
          timestamp: new Date().toISOString(),
          connectionString: connectionString.replace(/\/\/.*@/, "//***:***@"), // Mask credentials
        },
        metadata: { nodeType: "action", subtype: "database_select" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.connection_string) {
        errors.connection_string = "Connection string is required";
      }

      if (!config.query_type) {
        errors.query_type = "Query type is required";
      }

      if (config.query_type === "sql" && !config.sql_query) {
        errors.sql_query = "SQL query is required when using SQL query type";
      }

      if (config.query_type === "table" && !config.table_name) {
        errors.table_name =
          "Table name is required when using table select type";
      }

      if (config.where_conditions) {
        try {
          JSON.parse(config.where_conditions as string);
        } catch {
          errors.where_conditions = "Invalid JSON format for where conditions";
        }
      }

      if (
        config.limit &&
        (typeof config.limit !== "number" || config.limit <= 0)
      ) {
        errors.limit = "Limit must be a positive number";
      }

      if (
        config.offset &&
        (typeof config.offset !== "number" || config.offset < 0)
      ) {
        errors.offset = "Offset must be a non-negative number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
