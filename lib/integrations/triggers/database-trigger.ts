import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper function
function matchesColumnFilters(
  values: Record<string, unknown>,
  filters: Record<string, unknown>
): boolean {
  for (const [column, filterValue] of Object.entries(filters)) {
    const value = values[column];

    if (typeof filterValue === "object" && filterValue !== null) {
      // Handle operators like {"$in": ["high", "urgent"]}
      for (const [operator, operatorValue] of Object.entries(filterValue)) {
        switch (operator) {
          case "$in":
            if (
              !Array.isArray(operatorValue) ||
              !operatorValue.includes(value)
            ) {
              return false;
            }
            break;
          case "$nin":
            if (Array.isArray(operatorValue) && operatorValue.includes(value)) {
              return false;
            }
            break;
          case "$gt":
            if (typeof value !== "number" || value <= operatorValue) {
              return false;
            }
            break;
          case "$gte":
            if (typeof value !== "number" || value < operatorValue) {
              return false;
            }
            break;
          case "$lt":
            if (typeof value !== "number" || value >= operatorValue) {
              return false;
            }
            break;
          case "$lte":
            if (typeof value !== "number" || value > operatorValue) {
              return false;
            }
            break;
          case "$eq":
            if (value !== operatorValue) {
              return false;
            }
            break;
          case "$ne":
            if (value === operatorValue) {
              return false;
            }
            break;
          case "$like":
            if (
              typeof value !== "string" ||
              !value.includes(operatorValue as string)
            ) {
              return false;
            }
            break;
        }
      }
    } else {
      // Simple equality check
      if (value !== filterValue) {
        return false;
      }
    }
  }

  return true;
}

export const databaseTrigger: Integration = createIntegration({
  id: "database_trigger",
  name: "Database Change",
  category: "trigger",
  description: "Trigger on database INSERT, UPDATE, or DELETE",
  icon: "database",
  version: "1.0.0",

  hasInputHandle: false,

  schema: {
    fields: [
      {
        key: "connection_string",
        type: "text",
        label: "Database Connection",
        placeholder: "postgresql://user:pass@host:5432/db",
        required: true,
      },
      {
        key: "table_name",
        type: "text",
        label: "Table Name",
        placeholder: "users",
        required: true,
      },
      {
        key: "trigger_events",
        type: "select",
        label: "Trigger Events",
        required: true,
        options: [
          { label: "INSERT", value: "insert" },
          { label: "UPDATE", value: "update" },
          { label: "DELETE", value: "delete" },
          { label: "All Events", value: "all" },
        ],
      },
      {
        key: "column_filters",
        type: "textarea",
        label: "Column Filters (JSON)",
        placeholder:
          '{"status": "active", "priority": {"$in": ["high", "urgent"]}}',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Column filters must be a JSON string";
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
        key: "include_old_values",
        type: "boolean",
        label: "Include Old Values (for UPDATE/DELETE)",
        required: false,
      },
      {
        key: "batch_size",
        type: "number",
        label: "Batch Size",
        placeholder: "100",
        required: false,
      },
    ],
    required: ["connection_string", "table_name", "trigger_events"],
  },

  executor: {
    async execute(config) {
      // Simulate database monitoring delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      const connectionString = config.connection_string as string;
      const tableName = config.table_name as string;
      const triggerEvents = config.trigger_events as string;
      const includeOldValues = (config.include_old_values as boolean) || false;
      const batchSize = (config.batch_size as number) || 100;

      let columnFilters = {};
      if (config.column_filters) {
        try {
          columnFilters = JSON.parse(config.column_filters as string);
        } catch {
          return {
            success: false,
            error: "Invalid column filters JSON format",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "trigger", subtype: "database_trigger" },
          };
        }
      }

      // Mock database change events
      const mockEvents = [
        {
          event_type: "insert",
          table_name: tableName,
          record_id: "123e4567-e89b-12d3-a456-426614174000",
          new_values: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            email: "user@example.com",
            name: "John Doe",
            status: "active",
            priority: "high",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          old_values: null,
          changed_columns: [
            "id",
            "email",
            "name",
            "status",
            "priority",
            "created_at",
            "updated_at",
          ],
          timestamp: new Date().toISOString(),
        },
        {
          event_type: "update",
          table_name: tableName,
          record_id: "456e7890-e89b-12d3-a456-426614174001",
          new_values: {
            id: "456e7890-e89b-12d3-a456-426614174001",
            email: "jane@example.com",
            name: "Jane Smith",
            status: "inactive",
            priority: "medium",
            updated_at: new Date().toISOString(),
          },
          old_values: includeOldValues
            ? {
                id: "456e7890-e89b-12d3-a456-426614174001",
                email: "jane@example.com",
                name: "Jane Smith",
                status: "active",
                priority: "high",
                updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              }
            : null,
          changed_columns: ["status", "priority", "updated_at"],
          timestamp: new Date().toISOString(),
        },
      ];

      // Filter events based on trigger_events setting
      let filteredEvents = mockEvents;
      if (triggerEvents !== "all") {
        filteredEvents = mockEvents.filter(
          (event) => event.event_type === triggerEvents
        );
      }

      // Apply column filters if specified
      if (Object.keys(columnFilters).length > 0) {
        filteredEvents = filteredEvents.filter((event) => {
          return matchesColumnFilters(event.new_values, columnFilters);
        });
      }

      // Limit to batch size
      filteredEvents = filteredEvents.slice(0, batchSize);

      return {
        success: true,
        data: {
          events: filteredEvents,
          total_events: filteredEvents.length,
          table_name: tableName,
          trigger_events: triggerEvents,
          column_filters:
            Object.keys(columnFilters).length > 0 ? columnFilters : null,
          include_old_values: includeOldValues,
          batch_size: batchSize,
          connection_string: connectionString.replace(/\/\/.*@/, "//***:***@"), // Mask credentials
          trigger_time: new Date().toISOString(),
        },
        metadata: { nodeType: "trigger", subtype: "database_trigger" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.connection_string) {
        errors.connection_string = "Database connection string is required";
      }

      if (!config.table_name) {
        errors.table_name = "Table name is required";
      } else if (
        typeof config.table_name !== "string" ||
        config.table_name.trim().length === 0
      ) {
        errors.table_name = "Table name must be a non-empty string";
      }

      if (!config.trigger_events) {
        errors.trigger_events = "Trigger events are required";
      }

      if (config.column_filters) {
        try {
          const parsed = JSON.parse(config.column_filters as string);
          if (typeof parsed !== "object" || parsed === null) {
            errors.column_filters = "Column filters must be a JSON object";
          }
        } catch {
          errors.column_filters = "Invalid JSON format for column filters";
        }
      }

      if (
        config.batch_size &&
        (typeof config.batch_size !== "number" || config.batch_size <= 0)
      ) {
        errors.batch_size = "Batch size must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
