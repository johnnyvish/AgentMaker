// ============================================
// INTEGRATION FACTORY FUNCTION
// ============================================

import type { Integration, IntegrationSchema, SchemaField } from "./types";

export const createIntegration = (
  config: Omit<
    Integration,
    "colorClass" | "borderClass" | "selectedBorderClass"
  >
): Integration => {
  const categoryStyles = getCategoryStyles(config.category);

  return {
    ...config,
    ...categoryStyles,
  };
};

export const createCustomIntegration = (
  config: Omit<Integration, "version"> & { version?: string }
): Integration => {
  const categoryStyles = getCategoryStyles(config.category);

  return {
    version: "1.0.0",
    ...config,
    ...categoryStyles,
  };
};

export const createIntegrationSchema = (
  fields: SchemaField[],
  required: string[] = [],
  dependencies?: Record<string, string[]>
): IntegrationSchema => ({
  fields,
  required,
  dependencies,
});

export const createSchemaField = (config: SchemaField): SchemaField => config;

// ============================================
// CATEGORY-BASED STYLING
// ============================================

export const getCategoryStyles = (category: "trigger" | "action" | "logic") => {
  const styles = {
    trigger: {
      colorClass: "text-amber-600 dark:text-amber-400",
      borderClass:
        "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
      selectedBorderClass:
        "border-amber-600 dark:border-amber-400 shadow-lg ring-1 ring-amber-500/20 dark:ring-amber-400/20",
    },
    action: {
      colorClass: "text-sky-600 dark:text-sky-400",
      borderClass:
        "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
      selectedBorderClass:
        "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",
    },
    logic: {
      colorClass: "text-violet-600 dark:text-violet-400",
      borderClass:
        "border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700",
      selectedBorderClass:
        "border-violet-600 dark:border-violet-400 shadow-lg ring-1 ring-violet-500/20 dark:ring-violet-400/20",
    },
  };

  return styles[category];
};

// ============================================
// RUNTIME VALIDATION HELPER
// ============================================

export function validateIntegrationOutput(
  integrationId: string,
  result: { success: boolean; data?: Record<string, unknown> }
): boolean {
  if (!result.success) return true; // Don't validate failed executions

  const data = result.data;
  if (!data) return false;

  // Basic validation - ensure timestamp exists
  if (!data.timestamp || typeof data.timestamp !== "string") {
    console.warn(
      `Integration ${integrationId} missing required timestamp field`
    );
    return false;
  }

  return true;
}
