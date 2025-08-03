// ============================================
// TYPE DEFINITIONS
// ============================================

export interface WorkflowContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  executionId: string;
  userId?: string;
}

export interface IntegrationSchema {
  fields: SchemaField[];
  required: string[];
  dependencies?: Record<string, string[]>;
}

export interface SchemaField {
  key: string;
  type: "text" | "textarea" | "select" | "number" | "boolean" | "email" | "url";
  label: string;
  placeholder?: string;
  required?: boolean;
  supportExpressions?: boolean;
  options?:
    | Array<{ label: string; value: string }>
    | (() => Promise<Array<{ label: string; value: string }>>);
  validation?: (value: unknown) => string | null;
  dependsOn?: string;
}

export interface IntegrationExecutor {
  execute: (
    config: Record<string, unknown>,
    context: WorkflowContext
  ) => Promise<ExecutionResult>;
  validate?: (config: Record<string, unknown>) => ValidationResult;
}

export interface ExecutionResult extends Record<string, unknown> {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  metadata?: {
    nodeType: string;
    subtype: string;
    executionTime?: number;
    [key: string]: unknown;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface Integration {
  id: string;
  name: string;
  category: "trigger" | "action" | "logic";
  description: string;
  icon: string;
  version: string;

  // Visual styling (auto-generated based on category)
  colorClass?: string;
  borderClass?: string;
  selectedBorderClass?: string;

  // Integration logic
  schema: IntegrationSchema;
  executor: IntegrationExecutor;

  // Optional features
  auth?: {
    type: "oauth2" | "api_key" | "basic" | "none";
    required: boolean;
  };

  // For triggers only
  hasInputHandle?: boolean;
}
