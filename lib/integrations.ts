// lib/integrations-server.ts
// This is your integration registry that works in Node.js (no React)

// ============================================
// TYPE DEFINITIONS
// ============================================

interface WorkflowContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  executionId: string;
  userId?: string;
}

interface IntegrationSchema {
  fields: SchemaField[];
  required: string[];
  dependencies?: Record<string, string[]>;
}

interface SchemaField {
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

interface IntegrationExecutor {
  execute: (
    config: Record<string, unknown>,
    context: WorkflowContext
  ) => Promise<ExecutionResult>;
  validate?: (config: Record<string, unknown>) => ValidationResult;
}

interface ExecutionResult extends Record<string, unknown> {
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

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

interface Integration {
  id: string;
  name: string;
  category: "trigger" | "action" | "logic";
  description: string;
  icon: string;
  version: string;

  // Visual styling
  colorClass: string;
  borderClass: string;
  selectedBorderClass: string;

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

// ============================================
// INTEGRATION FACTORY FUNCTION
// ============================================

const createIntegration = (config: Integration): Integration => config;

// ============================================
// TRIGGER INTEGRATIONS
// ============================================

const TRIGGER_INTEGRATIONS = [
  createIntegration({
    id: "manual_trigger",
    name: "Manual",
    category: "trigger",
    description: "Trigger manually",
    icon: "hand",
    version: "1.0.0",

    colorClass: "text-amber-600 dark:text-amber-400",
    borderClass:
      "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
    selectedBorderClass:
      "border-amber-600 dark:border-amber-400 shadow-lg ring-1 ring-amber-500/20 dark:ring-amber-400/20",

    hasInputHandle: false,

    schema: {
      fields: [
        {
          key: "triggerName",
          type: "text",
          label: "Trigger Name",
          placeholder: "My Manual Trigger",
          required: false,
        },
      ],
      required: [],
    },

    executor: {
      async execute(config) {
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            triggered: true,
            timestamp,
            triggerName: (config.triggerName as string) || "Manual Trigger",
          },
          metadata: { nodeType: "trigger", subtype: "manual_trigger" },
        };
      },
    },
  }),

  createIntegration({
    id: "webhook_trigger",
    name: "Webhook",
    category: "trigger",
    description: "Receive HTTP requests",
    icon: "link",
    version: "1.0.0",

    colorClass: "text-amber-600 dark:text-amber-400",
    borderClass:
      "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
    selectedBorderClass:
      "border-amber-600 dark:border-amber-400 shadow-lg ring-1 ring-amber-500/20 dark:ring-amber-400/20",

    hasInputHandle: false,

    schema: {
      fields: [
        {
          key: "url",
          type: "url",
          label: "Webhook URL",
          placeholder: "https://...",
          required: true,
        },
        {
          key: "method",
          type: "select",
          label: "HTTP Method",
          required: true,
          options: [
            { label: "POST", value: "POST" },
            { label: "GET", value: "GET" },
            { label: "PUT", value: "PUT" },
          ],
        },
      ],
      required: ["url", "method"],
    },

    executor: {
      async execute() {
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "user-agent": "GitHub-Hookshot/abc123",
            },
            body: {
              event: "push",
              repository: { name: "my-app", owner: "johndoe" },
              commits: [
                { message: "Fix user login bug", author: "Jane Smith" },
              ],
            },
            timestamp,
          },
          metadata: { nodeType: "trigger", subtype: "webhook_trigger" },
        };
      },
    },
  }),

  createIntegration({
    id: "schedule_trigger",
    name: "Schedule",
    category: "trigger",
    description: "Run on a schedule",
    icon: "clock",
    version: "1.0.0",

    colorClass: "text-amber-600 dark:text-amber-400",
    borderClass:
      "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
    selectedBorderClass:
      "border-amber-600 dark:border-amber-400 shadow-lg ring-1 ring-amber-500/20 dark:ring-amber-400/20",

    hasInputHandle: false,

    schema: {
      fields: [
        {
          key: "schedule",
          type: "select",
          label: "Schedule",
          required: true,
          options: [
            { label: "Every minute", value: "* * * * *" },
            { label: "Every hour", value: "0 * * * *" },
            { label: "Every day", value: "0 0 * * *" },
            { label: "Every week", value: "0 0 * * 0" },
          ],
        },
        {
          key: "timezone",
          type: "select",
          label: "Timezone",
          required: false,
          options: [
            { label: "UTC", value: "UTC" },
            { label: "America/New_York", value: "America/New_York" },
            { label: "America/Los_Angeles", value: "America/Los_Angeles" },
          ],
        },
      ],
      required: ["schedule"],
    },

    executor: {
      async execute(config) {
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            schedule: config.schedule as string,
            timezone: (config.timezone as string) || "UTC",
            timestamp,
          },
          metadata: { nodeType: "trigger", subtype: "schedule_trigger" },
        };
      },
    },
  }),
];

// ============================================
// ACTION INTEGRATIONS
// ============================================

const ACTION_INTEGRATIONS = [
  createIntegration({
    id: "slack_send_message",
    name: "Send Slack Message",
    category: "action",
    description: "Send a message to a Slack channel",
    icon: "message-square",
    version: "1.0.0",

    colorClass: "text-sky-600 dark:text-sky-400",
    borderClass:
      "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
    selectedBorderClass:
      "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",

    auth: {
      type: "oauth2",
      required: true,
    },

    schema: {
      fields: [
        {
          key: "channel",
          type: "select",
          label: "Channel",
          placeholder: "#general",
          required: true,
          options: [
            { label: "#general", value: "general" },
            { label: "#random", value: "random" },
            { label: "#dev", value: "dev" },
          ],
        },
        {
          key: "message",
          type: "textarea",
          label: "Message",
          placeholder:
            "New deployment by {{$node.webhook-1.data.commits.0.author}}",
          required: true,
          supportExpressions: true,
        },
        {
          key: "username",
          type: "text",
          label: "Bot Username",
          placeholder: "WorkflowBot",
          required: false,
        },
      ],
      required: ["channel", "message"],
    },

    executor: {
      async execute(config) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            messageId: "1234567890.123456",
            channel: config.channel as string,
            message: config.message as string,
            timestamp,
            user: "U123ABCDEF",
            permalink:
              "https://workspace.slack.com/archives/C123/p1609459200123456",
          },
          metadata: { nodeType: "action", subtype: "slack_send_message" },
        };
      },

      validate(config) {
        const errors: Record<string, string> = {};

        if (!config.channel) errors.channel = "Channel is required";
        if (!config.message) errors.message = "Message is required";

        return {
          valid: Object.keys(errors).length === 0,
          errors,
        };
      },
    },
  }),

  createIntegration({
    id: "set_variable",
    name: "Set Variable",
    category: "action",
    description: "Store data in a variable",
    icon: "database",
    version: "1.0.0",

    colorClass: "text-sky-600 dark:text-sky-400",
    borderClass:
      "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
    selectedBorderClass:
      "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",

    schema: {
      fields: [
        {
          key: "variableName",
          type: "text",
          label: "Variable Name",
          placeholder: "myVariable",
          required: true,
          validation: (value: unknown) => {
            if (
              typeof value !== "string" ||
              !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
            ) {
              return "Variable name must start with letter or underscore and contain only letters, numbers, and underscores";
            }
            return null;
          },
        },
        {
          key: "value",
          type: "textarea",
          label: "Value",
          placeholder: "Enter value or reference data...",
          required: true,
          supportExpressions: true,
        },
      ],
      required: ["variableName", "value"],
    },

    executor: {
      async execute(config, context) {
        if (config.variableName) {
          context.variables[config.variableName as string] = config.value;
        }

        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            variableName: config.variableName as string,
            value: config.value,
            timestamp,
          },
          metadata: { nodeType: "action", subtype: "set_variable" },
        };
      },

      validate(config) {
        const errors: Record<string, string> = {};

        if (!config.variableName) {
          errors.variableName = "Variable name is required";
        } else if (
          !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.variableName as string)
        ) {
          errors.variableName = "Invalid variable name format";
        }

        if (!config.value) {
          errors.value = "Value is required";
        }

        return {
          valid: Object.keys(errors).length === 0,
          errors,
        };
      },
    },
  }),

  createIntegration({
    id: "email_send",
    name: "Send Email",
    category: "action",
    description: "Send an email message",
    icon: "mail",
    version: "1.0.0",

    colorClass: "text-sky-600 dark:text-sky-400",
    borderClass:
      "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
    selectedBorderClass:
      "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",

    auth: {
      type: "api_key",
      required: true,
    },

    schema: {
      fields: [
        {
          key: "to",
          type: "email",
          label: "To Email",
          placeholder: "user@example.com",
          required: true,
        },
        {
          key: "subject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject",
          required: true,
          supportExpressions: true,
        },
        {
          key: "body",
          type: "textarea",
          label: "Body",
          placeholder:
            "Hello {{$node.webhook-1.data.user.name}}, your order {{$node.webhook-1.data.order.id}} has been shipped!",
          required: true,
          supportExpressions: true,
        },
      ],
      required: ["to", "subject", "body"],
    },

    executor: {
      async execute(config) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            messageId: "<20241201120000.abc123@smtp.gmail.com>",
            to: config.to as string,
            subject: config.subject as string,
            status: "sent",
            deliveryTime: "2.3s",
            provider: "SendGrid",
            timestamp,
          },
          metadata: { nodeType: "action", subtype: "email_send" },
        };
      },
    },
  }),

  createIntegration({
    id: "api_request",
    name: "API Request",
    category: "action",
    description: "Make an HTTP API request",
    icon: "globe",
    version: "1.0.0",

    colorClass: "text-sky-600 dark:text-sky-400",
    borderClass:
      "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
    selectedBorderClass:
      "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",

    schema: {
      fields: [
        {
          key: "url",
          type: "url",
          label: "API Endpoint",
          placeholder: "https://api.example.com/endpoint",
          required: true,
        },
        {
          key: "method",
          type: "select",
          label: "HTTP Method",
          required: true,
          options: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "DELETE", value: "DELETE" },
          ],
        },
        {
          key: "headers",
          type: "textarea",
          label: "Headers (JSON)",
          placeholder: '{"Authorization": "Bearer token"}',
          required: false,
        },
        {
          key: "body",
          type: "textarea",
          label: "Request Body (JSON)",
          placeholder:
            '{"user_id": "{{$node.webhook-1.data.user.id}}", "status": "{{$node.webhook-1.data.status}}"}',
          required: false,
          supportExpressions: true,
        },
      ],
      required: ["url", "method"],
    },

    executor: {
      async execute() {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            status: 200,
            statusText: "OK",
            headers: {
              "content-type": "application/json",
              "x-ratelimit-remaining": "4999",
            },
            response: {
              id: 12345,
              name: "John Doe",
              email: "john@example.com",
              created_at: "2024-12-01T10:30:00Z",
            },
            responseTime: "245ms",
            timestamp,
          },
          metadata: { nodeType: "action", subtype: "api_request" },
        };
      },
    },
  }),

  createIntegration({
    id: "delay",
    name: "Delay",
    category: "action",
    description: "Wait for a specified amount of time",
    icon: "clock",
    version: "1.0.0",

    colorClass: "text-sky-600 dark:text-sky-400",
    borderClass:
      "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
    selectedBorderClass:
      "border-sky-600 dark:border-sky-400 shadow-lg ring-1 ring-sky-500/20 dark:ring-sky-400/20",

    schema: {
      fields: [
        {
          key: "amount",
          type: "number",
          label: "Delay Amount",
          placeholder: "5",
          required: true,
        },
        {
          key: "unit",
          type: "select",
          label: "Time Unit",
          required: true,
          options: [
            { label: "Seconds", value: "seconds" },
            { label: "Minutes", value: "minutes" },
            { label: "Hours", value: "hours" },
          ],
        },
      ],
      required: ["amount", "unit"],
    },

    executor: {
      async execute(config) {
        const amount = Number(config.amount) || 1;
        const unit = config.unit as string;

        let delayMs = amount * 1000; // default to seconds
        if (unit === "minutes") delayMs = amount * 60 * 1000;
        if (unit === "hours") delayMs = amount * 60 * 60 * 1000;

        // For demo purposes, we'll just simulate the delay
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(delayMs, 2000))
        );

        const timestamp = new Date().toISOString();
        return {
          success: true,
          data: {
            delayAmount: amount,
            delayUnit: unit,
            actualDelayMs: delayMs,
            timestamp,
          },
          metadata: { nodeType: "action", subtype: "delay" },
        };
      },
    },
  }),
];

// ============================================
// LOGIC INTEGRATIONS
// ============================================

const LOGIC_INTEGRATIONS = [
  createIntegration({
    id: "filter_condition",
    name: "Filter",
    category: "logic",
    description: "Filter data conditionally",
    icon: "search",
    version: "1.0.0",

    colorClass: "text-violet-600 dark:text-violet-400",
    borderClass:
      "border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700",
    selectedBorderClass:
      "border-violet-600 dark:border-violet-400 shadow-lg ring-1 ring-violet-500/20 dark:ring-violet-400/20",

    schema: {
      fields: [
        {
          key: "field",
          type: "text",
          label: "Field to Check",
          placeholder: "{{$node.webhook-1.data.status}}",
          required: true,
          supportExpressions: true,
        },
        {
          key: "operator",
          type: "select",
          label: "Condition",
          required: true,
          options: [
            { label: "equals", value: "equals" },
            { label: "does not equal", value: "not_equals" },
            { label: "contains", value: "contains" },
            { label: "is greater than", value: "greater_than" },
            { label: "is less than", value: "less_than" },
          ],
        },
        {
          key: "value",
          type: "text",
          label: "Comparison Value",
          placeholder: "active",
          required: true,
          supportExpressions: true,
        },
      ],
      required: ["field", "operator", "value"],
    },

    executor: {
      async execute(config) {
        const sampleValue = "active"; // Simulate checking a status field
        const conditionMet = sampleValue === config.value;
        const timestamp = new Date().toISOString();

        return {
          success: true,
          data: {
            field: config.field as string,
            operator: config.operator as string,
            expectedValue: config.value,
            actualValue: sampleValue,
            conditionMet,
            matchedRecords: conditionMet ? 42 : 0,
            timestamp,
          },
          metadata: { nodeType: "logic", subtype: "filter_condition" },
        };
      },
    },
  }),

  createIntegration({
    id: "branch_condition",
    name: "Branch",
    category: "logic",
    description: "Split workflow into multiple paths",
    icon: "diamond",
    version: "1.0.0",

    colorClass: "text-violet-600 dark:text-violet-400",
    borderClass:
      "border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700",
    selectedBorderClass:
      "border-violet-600 dark:border-violet-400 shadow-lg ring-1 ring-violet-500/20 dark:ring-violet-400/20",

    schema: {
      fields: [
        {
          key: "condition",
          type: "textarea",
          label: "Condition Expression",
          placeholder: "{{$node.trigger-1.data.status}} === 'active'",
          required: true,
          supportExpressions: true,
        },
        {
          key: "trueLabel",
          type: "text",
          label: "True Path Label",
          placeholder: "If condition is true",
          required: false,
        },
        {
          key: "falseLabel",
          type: "text",
          label: "False Path Label",
          placeholder: "If condition is false",
          required: false,
        },
      ],
      required: ["condition"],
    },

    executor: {
      async execute(config) {
        // Evaluate condition (simplified for demo)
        const conditionResult = Math.random() > 0.5; // Random result for demo
        const timestamp = new Date().toISOString();

        return {
          success: true,
          data: {
            condition: config.condition as string,
            result: conditionResult,
            path: conditionResult ? "true" : "false",
            timestamp,
          },
          metadata: { nodeType: "logic", subtype: "branch_condition" },
        };
      },
    },
  }),

  createIntegration({
    id: "transform_data",
    name: "Transform Data",
    category: "logic",
    description: "Transform and format data",
    icon: "brain",
    version: "1.0.0",

    colorClass: "text-violet-600 dark:text-violet-400",
    borderClass:
      "border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700",
    selectedBorderClass:
      "border-violet-600 dark:border-violet-400 shadow-lg ring-1 ring-violet-500/20 dark:ring-violet-400/20",

    schema: {
      fields: [
        {
          key: "inputData",
          type: "textarea",
          label: "Input Data",
          placeholder: "{{$node.previous-node.data}}",
          required: true,
          supportExpressions: true,
        },
        {
          key: "transformation",
          type: "select",
          label: "Transformation Type",
          required: true,
          options: [
            { label: "Format JSON", value: "format_json" },
            { label: "Extract Field", value: "extract_field" },
            { label: "Convert to String", value: "to_string" },
            { label: "Convert to Number", value: "to_number" },
          ],
        },
        {
          key: "fieldPath",
          type: "text",
          label: "Field Path (for extraction)",
          placeholder: "{{$node.webhook-1.data.user.email}}",
          required: false,
        },
      ],
      required: ["inputData", "transformation"],
    },

    executor: {
      async execute(config) {
        const transformation = config.transformation as string;
        const inputData = config.inputData;
        const timestamp = new Date().toISOString();

        let result;
        switch (transformation) {
          case "format_json":
            result = JSON.stringify(inputData, null, 2);
            break;
          case "extract_field":
            result = `Extracted: ${config.fieldPath}`;
            break;
          case "to_string":
            result = String(inputData);
            break;
          case "to_number":
            result = Number(inputData) || 0;
            break;
          default:
            result = inputData;
        }

        return {
          success: true,
          data: {
            input: inputData,
            transformation,
            result,
            timestamp,
          },
          metadata: { nodeType: "logic", subtype: "transform_data" },
        };
      },
    },
  }),
];

// ============================================
// RUNTIME VALIDATION HELPER
// ============================================

function validateIntegrationOutput(
  integrationId: string,
  result: ExecutionResult
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

// ============================================
// INTEGRATION REGISTRY CLASS
// ============================================

class IntegrationRegistry {
  private integrations = new Map<string, Integration>();

  constructor() {
    // Register all integrations
    this.registerIntegrations([
      ...TRIGGER_INTEGRATIONS,
      ...ACTION_INTEGRATIONS,
      ...LOGIC_INTEGRATIONS,
    ]);
  }

  private registerIntegrations(integrations: Integration[]) {
    integrations.forEach((integration) => {
      this.integrations.set(integration.id, integration);
    });
  }

  register(integration: Integration) {
    this.integrations.set(integration.id, integration);
  }

  unregister(id: string) {
    return this.integrations.delete(id);
  }

  get(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  getByCategory(category: "trigger" | "action" | "logic"): Integration[] {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.category === category
    );
  }

  getAll(): Integration[] {
    return Array.from(this.integrations.values());
  }

  getTriggers(): Integration[] {
    return this.getByCategory("trigger");
  }

  getActions(): Integration[] {
    return this.getByCategory("action");
  }

  getLogic(): Integration[] {
    return this.getByCategory("logic");
  }

  // Search integrations by name, description, or category
  search(query: string): Integration[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.integrations.values()).filter(
      (integration) =>
        integration.name.toLowerCase().includes(lowercaseQuery) ||
        integration.description.toLowerCase().includes(lowercaseQuery) ||
        integration.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get integrations with auth requirements
  getAuthRequired(): Integration[] {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.auth?.required
    );
  }

  // Get integrations by version
  getByVersion(version: string): Integration[] {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.version === version
    );
  }

  // Validate integration configuration
  validateConfig(
    integrationId: string,
    config: Record<string, unknown>
  ): ValidationResult {
    const integration = this.get(integrationId);
    if (!integration) {
      return {
        valid: false,
        errors: { integration: "Integration not found" },
      };
    }

    if (integration.executor.validate) {
      return integration.executor.validate(config);
    }

    // Basic validation based on schema
    const errors: Record<string, string> = {};
    integration.schema.required.forEach((field) => {
      if (!config[field]) {
        errors[field] = `${field} is required`;
      }
    });

    // Field-level validation
    integration.schema.fields.forEach((field) => {
      const value = config[field.key];
      if (field.validation && value !== undefined) {
        const validationError = field.validation(value);
        if (validationError) {
          errors[field.key] = validationError;
        }
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Execute an integration
  async executeIntegration(
    integrationId: string,
    config: Record<string, unknown>,
    context: WorkflowContext
  ): Promise<ExecutionResult> {
    const integration = this.get(integrationId);
    if (!integration) {
      return {
        success: false,
        error: `Integration '${integrationId}' not found`,
        metadata: {
          nodeType: "unknown",
          subtype: integrationId,
        },
      };
    }

    try {
      const startTime = Date.now();
      const result = await integration.executor.execute(config, context);
      const executionTime = Date.now() - startTime;

      // Add execution time to metadata
      if (result.metadata) {
        result.metadata.executionTime = executionTime;
      }

      // Validate output schema
      if (!validateIntegrationOutput(integrationId, result)) {
        console.warn(
          `Integration ${integrationId} returned invalid output schema`
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          nodeType: integration.category,
          subtype: integrationId,
        },
      };
    }
  }

  // Get integration statistics
  getStats() {
    const integrations = this.getAll();
    return {
      total: integrations.length,
      triggers: this.getTriggers().length,
      actions: this.getActions().length,
      logic: this.getLogic().length,
      withAuth: this.getAuthRequired().length,
    };
  }
}

// Create and export the global registry instance
export const integrationRegistry = new IntegrationRegistry();

// Export types for external use
export type {
  Integration,
  IntegrationSchema,
  SchemaField,
  IntegrationExecutor,
  ExecutionResult,
  ValidationResult,
  WorkflowContext,
};

// Export the registry class for advanced usage
export { IntegrationRegistry };

// Export helper functions
export const createCustomIntegration = (
  config: Omit<Integration, "version"> & { version?: string }
): Integration => {
  return {
    version: "1.0.0",
    ...config,
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
