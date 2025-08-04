import { createIntegration } from "../utils";
import type { Integration } from "../types";

// Helper functions
function evaluateCondition(data: unknown, condition: string): boolean {
  // This is a simplified condition evaluator
  // In a real implementation, you'd use a proper expression evaluator like expr-eval or similar
  
  // Handle simple equality checks
  if (condition.includes("===")) {
    const [field, value] = condition.split("===").map(s => s.trim().replace(/['"]/g, ""));
    const fieldValue = getFieldValue(data, field);
    return fieldValue === value;
  }
  
  if (condition.includes("==")) {
    const [field, value] = condition.split("==").map(s => s.trim().replace(/['"]/g, ""));
    const fieldValue = getFieldValue(data, field);
    return fieldValue == value; // Loose equality
  }
  
  if (condition.includes("!=")) {
    const [field, value] = condition.split("!=").map(s => s.trim().replace(/['"]/g, ""));
    const fieldValue = getFieldValue(data, field);
    return fieldValue !== value;
  }
  
  // Handle contains checks
  if (condition.includes(".includes(")) {
    const fieldMatch = condition.match(/(\w+)\.includes\(['"]([^'"]+)['"]\)/);
    if (fieldMatch) {
      const [, field, value] = fieldMatch;
      const fieldValue = getFieldValue(data, field);
      return typeof fieldValue === "string" && fieldValue.includes(value);
    }
  }
  
  // Handle boolean checks
  if (condition.includes("=== true") || condition.includes("=== false")) {
    const field = condition.split("===")[0].trim();
    const expectedValue = condition.includes("=== true");
    const fieldValue = getFieldValue(data, field);
    return Boolean(fieldValue) === expectedValue;
  }
  
  // Default to false for unrecognized conditions
  return false;
}

function getFieldValue(data: unknown, fieldPath: string): unknown {
  if (!fieldPath) return data;
  
  const keys = fieldPath.split(".");
  let value: unknown = data;
  
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

export const router: Integration = createIntegration({
  id: "router",
  name: "Router",
  category: "logic",
  description: "Route data to multiple paths simultaneously", 
  icon: "workflow",
  version: "1.0.0",
  
  schema: {
    fields: [
      {
        key: "input_data",
        type: "textarea",
        label: "Input Data",
        placeholder: "{{$node.webhook-1.data}}",
        required: true,
        supportExpressions: true,
      },
      {
        key: "routes",
        type: "textarea",
        label: "Route Configurations (JSON)",
        placeholder: '{"urgent": {"condition": "priority === \\"high\\""}, "normal": {"condition": "priority === \\"normal\\""}}',
        required: true,
        validation: (value: unknown) => {
          if (typeof value !== "string") {
            return "Routes must be a JSON string";
          }
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed !== "object" || parsed === null) {
              return "Routes must be a JSON object";
            }
            return null;
          } catch (e) {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "default_route",
        type: "text",
        label: "Default Route",
        placeholder: "fallback",
        required: false,
      },
      {
        key: "route_to_all",
        type: "boolean",
        label: "Route to All Matching Paths",
        required: false,
      },
      {
        key: "include_metadata",
        type: "boolean",
        label: "Include Routing Metadata",
        required: false,
      },
    ],
    required: ["input_data", "routes"],
  },

  executor: {
    async execute(config) {
      const inputData = config.input_data as unknown;
      const routeToAll = config.route_to_all as boolean || false;
      const includeMetadata = config.include_metadata as boolean || false;
      const defaultRoute = config.default_route as string;
      
      let routes = {};
      try {
        routes = JSON.parse(config.routes as string);
      } catch (e) {
        return {
          success: false,
          error: "Invalid routes JSON format",
          data: {
            timestamp: new Date().toISOString(),
          },
          metadata: { nodeType: "logic", subtype: "router" },
        };
      }

      const activeRoutes: string[] = [];
      const routeResults: Record<string, unknown> = {};
      const routingMetadata: Record<string, unknown> = {};

      // Evaluate each route condition
      for (const [routeName, routeConfig] of Object.entries(routes)) {
        const condition = (routeConfig as Record<string, unknown>).condition as string;
        
        if (condition) {
          try {
            // Simple condition evaluation (in a real implementation, you'd use a proper expression evaluator)
            const isMatch = evaluateCondition(inputData, condition);
            
            if (isMatch) {
              activeRoutes.push(routeName);
              routeResults[routeName] = {
                input_data: inputData,
                route_name: routeName,
                condition: condition,
                matched: true,
                timestamp: new Date().toISOString(),
              };
              
              if (includeMetadata) {
                routingMetadata[routeName] = {
                  condition_evaluated: condition,
                  evaluation_result: true,
                  evaluation_time: new Date().toISOString(),
                };
              }
              
              // If not routing to all, stop after first match
              if (!routeToAll) {
                break;
              }
            } else if (includeMetadata) {
              routingMetadata[routeName] = {
                condition_evaluated: condition,
                evaluation_result: false,
                evaluation_time: new Date().toISOString(),
              };
            }
          } catch (error) {
            if (includeMetadata) {
              routingMetadata[routeName] = {
                condition_evaluated: condition,
                evaluation_result: false,
                evaluation_error: String(error),
                evaluation_time: new Date().toISOString(),
              };
            }
          }
        }
      }

      // If no routes matched and default route is specified
      if (activeRoutes.length === 0 && defaultRoute) {
        activeRoutes.push(defaultRoute);
        routeResults[defaultRoute] = {
          input_data: inputData,
          route_name: defaultRoute,
          condition: "default",
          matched: false,
          is_default: true,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: {
          input_data: inputData,
          active_routes: activeRoutes,
          route_results: routeResults,
          total_routes: Object.keys(routes).length,
          active_route_count: activeRoutes.length,
          route_to_all: routeToAll,
          default_route: defaultRoute || null,
          routing_metadata: includeMetadata ? routingMetadata : null,
          timestamp: new Date().toISOString(),
        },
        metadata: { nodeType: "logic", subtype: "router" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.input_data) {
        errors.input_data = "Input data is required";
      }

      if (!config.routes) {
        errors.routes = "Routes configuration is required";
      } else {
        try {
          const parsed = JSON.parse(config.routes as string);
          if (typeof parsed !== "object" || parsed === null) {
            errors.routes = "Routes must be a JSON object";
          }
        } catch (e) {
          errors.routes = "Invalid JSON format for routes";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 