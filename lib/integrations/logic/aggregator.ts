import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper functions
function filterData(
  data: unknown[],
  filterCondition: Record<string, unknown>
): unknown[] {
  return data.filter((item) => {
    if (typeof item !== "object" || item === null) return false;

    for (const [key, condition] of Object.entries(filterCondition)) {
      const value = (item as Record<string, unknown>)[key];

      if (typeof condition === "object" && condition !== null) {
        // Handle operators like {"$gt": 0}
        for (const [operator, operatorValue] of Object.entries(condition)) {
          switch (operator) {
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
            case "$eq":
              if (value !== operatorValue) return false;
              break;
            case "$ne":
              if (value === operatorValue) return false;
              break;
            case "$in":
              if (
                !Array.isArray(operatorValue) ||
                !operatorValue.includes(value)
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
  });
}

function getFieldValue(item: unknown, fieldPath: string): unknown {
  if (!fieldPath) return item;

  const keys = fieldPath.split(".");
  let value: unknown = item;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

function aggregateSum(data: unknown[], fieldPath: string): number {
  return data.reduce<number>((sum, item) => {
    const value = getFieldValue(item, fieldPath);
    if (typeof value === "number" && !isNaN(value)) {
      return sum + value;
    }
    return sum;
  }, 0);
}

function aggregateAverage(data: unknown[], fieldPath: string): number {
  const values = data
    .map((item) => getFieldValue(item, fieldPath))
    .filter((value) => typeof value === "number" && !isNaN(value)) as number[];

  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function aggregateMin(data: unknown[], fieldPath: string): unknown {
  const values = data
    .map((item) => getFieldValue(item, fieldPath))
    .filter((value) => value !== undefined && value !== null);

  if (values.length === 0) return null;
  return Math.min(...(values as number[]));
}

function aggregateMax(data: unknown[], fieldPath: string): unknown {
  const values = data
    .map((item) => getFieldValue(item, fieldPath))
    .filter((value) => value !== undefined && value !== null);

  if (values.length === 0) return null;
  return Math.max(...(values as number[]));
}

function aggregateConcat(
  data: unknown[],
  fieldPath: string,
  separator: string
): string {
  const values = data
    .map((item) => getFieldValue(item, fieldPath))
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value));

  return values.join(separator);
}

function aggregateMerge(data: unknown[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const item of data) {
    if (item && typeof item === "object") {
      Object.assign(result, item);
    }
  }

  return result;
}

function aggregateGroup(
  data: unknown[],
  groupByField: string,
  valueField: string
): Record<string, unknown> {
  const groups: Record<string, unknown[]> = {};

  for (const item of data) {
    const groupKey = getFieldValue(item, groupByField);
    if (groupKey !== undefined) {
      const key = String(groupKey);
      if (!groups[key]) groups[key] = [];
      groups[key].push(getFieldValue(item, valueField));
    }
  }

  return groups;
}

function aggregateUnique(data: unknown[], fieldPath: string): unknown[] {
  const values = data
    .map((item) => getFieldValue(item, fieldPath))
    .filter((value) => value !== undefined && value !== null);

  return Array.from(new Set(values));
}

export const aggregator: Integration = createIntegration({
  id: "aggregator",
  name: "Aggregator",
  category: "logic",
  description: "Collect and combine data from multiple sources",
  icon: "layers",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "operation",
        type: "select",
        label: "Aggregation Operation",
        required: true,
        options: [
          { label: "Sum", value: "sum" },
          { label: "Average", value: "average" },
          { label: "Count", value: "count" },
          { label: "Min", value: "min" },
          { label: "Max", value: "max" },
          { label: "Concatenate", value: "concat" },
          { label: "Merge Objects", value: "merge" },
          { label: "Group By", value: "group" },
          { label: "Unique Values", value: "unique" },
        ],
      },
      {
        key: "input_data",
        type: "textarea",
        label: "Input Data",
        placeholder: "{{$node.iterator-1.data.results}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "field_path",
        type: "text",
        label: "Field to Aggregate (for array of objects)",
        placeholder:
          "value or price or {{$node.iterator-1.data.results.*.value}}",
        supportExpressions: true,
      },
      {
        key: "group_by_field",
        type: "text",
        label: "Group By Field (for group operation)",
        placeholder: "category or status",
        required: false,
      },
      {
        key: "separator",
        type: "text",
        label: "Separator (for concatenate)",
        placeholder: ", ",
        required: false,
      },
      {
        key: "filter_condition",
        type: "textarea",
        label: "Filter Condition (JSON)",
        placeholder: '{"status": "active", "value": {"$gt": 0}}',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Filter condition must be a JSON string";
          }
          try {
            JSON.parse(value);
            return null;
          } catch {
            return "Invalid JSON format";
          }
        },
      },
    ],
    required: ["operation", "input_data"],
  },

  executor: {
    async execute(config) {
      const operation = config.operation as string;
      const inputData = config.input_data as unknown;
      const fieldPath = config.field_path as string;
      const groupByField = config.group_by_field as string;
      const separator = (config.separator as string) || ", ";

      let filterCondition = {};
      if (config.filter_condition) {
        try {
          filterCondition = JSON.parse(config.filter_condition as string);
        } catch {
          return {
            success: false,
            error: "Invalid filter condition JSON format",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "logic", subtype: "aggregator" },
          };
        }
      }

      // Ensure input is an array
      if (!Array.isArray(inputData)) {
        return {
          success: false,
          error: "Input data must be an array",
          data: {
            input_type: typeof inputData,
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "logic", subtype: "aggregator" },
        };
      }

      // Apply filter if specified
      let filteredData = inputData;
      if (Object.keys(filterCondition).length > 0) {
        filteredData = filterData(inputData, filterCondition);
      }

      let result: unknown;
      const metadata: Record<string, unknown> = {
        input_count: inputData.length,
        filtered_count: filteredData.length,
        operation,
      };

      switch (operation) {
        case "sum":
          result = aggregateSum(filteredData, fieldPath);
          break;

        case "average":
          result = aggregateAverage(filteredData, fieldPath);
          break;

        case "count":
          result = filteredData.length;
          break;

        case "min":
          result = aggregateMin(filteredData, fieldPath);
          break;

        case "max":
          result = aggregateMax(filteredData, fieldPath);
          break;

        case "concat":
          result = aggregateConcat(filteredData, fieldPath, separator);
          break;

        case "merge":
          result = aggregateMerge(filteredData);
          break;

        case "group":
          result = aggregateGroup(filteredData, groupByField, fieldPath);
          break;

        case "unique":
          result = aggregateUnique(filteredData, fieldPath);
          break;

        default:
          return {
            success: false,
            error: `Unknown aggregation operation: ${operation}`,
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "logic", subtype: "aggregator" },
          };
      }

      return {
        success: true,
        data: {
          result,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        metadata: { nodeType: "logic", subtype: "aggregator" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.operation) {
        errors.operation = "Aggregation operation is required";
      }

      if (!config.input_data) {
        errors.input_data = "Input data is required";
      }

      if (config.operation === "group" && !config.group_by_field) {
        errors.group_by_field =
          "Group by field is required for group operation";
      }

      if (config.filter_condition) {
        try {
          JSON.parse(config.filter_condition as string);
        } catch {
          errors.filter_condition = "Invalid JSON format for filter condition";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
