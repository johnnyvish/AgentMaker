import type {
  Integration,
  WorkflowContext,
  ExecutionResult,
  ValidationResult,
} from "./types";
import { validateIntegrationOutput } from "./utils";
import { parseExpression } from "../expression";

// Import all integrations
import { manualTrigger } from "./triggers/manual-trigger";
import { webhookTrigger } from "./triggers/webhook-trigger";
import { scheduleTrigger } from "./triggers/schedule-trigger";

// New Triggers
import { emailTrigger } from "./triggers/email-trigger";
import { formTrigger } from "./triggers/form-trigger";
import { databaseTrigger } from "./triggers/database-trigger";
import { fileWatcherTrigger } from "./triggers/file-watcher-trigger";
import { slackSendMessage } from "./actions/slack-send-message";
import { setVariable } from "./actions/set-variable";
import { emailSend } from "./actions/email-send";
import { apiRequest } from "./actions/api-request";
import { delay } from "./actions/delay";
import { aiIntegration } from "./actions/ai";
import { filterCondition } from "./logic/filter-condition";
import { branchCondition } from "./logic/branch-condition";
import { transformData } from "./logic/transform-data";

// New Logic Nodes
import { iteratorLoop } from "./logic/iterator-loop";
import { switchCase } from "./logic/switch-case";
import { dataValidator } from "./logic/data-validator";
import { aggregator } from "./logic/aggregator";
import { router } from "./logic/router";

// Communication & Messaging
import { discordSendMessage } from "./actions/discord-send-message";
import { teamsSendMessage } from "./actions/teams-send-message";
import { telegramSendMessage } from "./actions/telegram-send-message";

// Databases & Storage
import { postgresInsert } from "./actions/postgres-insert";
import { sheetsAppendRow } from "./actions/sheets-append-row";
import { airtableCreateRecord } from "./actions/airtable-create-record";
import { googleSheetsAppend } from "./actions/google-sheets-append";
import { databaseInsert } from "./actions/database-insert";
import { databaseSelect } from "./actions/database-select";

// Payments & Finance
import { stripeCreatePayment } from "./actions/stripe-create-payment";
import { paypalSendPayment } from "./actions/paypal-send-payment";

// CRM & Sales
import { hubspotCreateContact } from "./actions/hubspot-create-contact";
import { salesforceCreateLead } from "./actions/salesforce-create-lead";

// Project Management
import { asanaCreateTask } from "./actions/asana-create-task";
import { trelloCreateCard } from "./actions/trello-create-card";

// Cloud Storage
import { s3UploadFile } from "./actions/s3-upload-file";
import { driveUploadFile } from "./actions/drive-upload-file";

// Email Marketing
import { mailchimpAddSubscriber } from "./actions/mailchimp-add-subscriber";
import { sendgridSendEmail } from "./actions/sendgrid-send-email";

// Social Media
import { twitterPostTweet } from "./actions/twitter-post-tweet";
import { linkedinCreatePost } from "./actions/linkedin-create-post";

// Development Tools
import { githubCreateIssue } from "./actions/github-create-issue";
import { jiraCreateIssue } from "./actions/jira-create-issue";

// Business Tools
import { zoomCreateMeeting } from "./actions/zoom-create-meeting";
import { notionCreatePage } from "./actions/notion-create-page";

// Additional Integrations
import { smsSend } from "./actions/sms-send";
import { redisSet } from "./actions/redis-set";
import { cloudinaryUploadImage } from "./actions/cloudinary-upload-image";

// Calendar & Scheduling
import { googleCalendarCreateEvent } from "./actions/google-calendar-create-event";
import { calendlyCreateBooking } from "./actions/calendly-create-booking";
import { outlookCalendarCreateEvent } from "./actions/outlook-calendar-create-event";

// File Processing & Data
import { csvParser } from "./actions/csv-parser";
import { pdfGenerator } from "./actions/pdf-generator";
import { imageProcessor } from "./actions/image-processor";

// Authentication & Security
import { jwtTokenGenerator } from "./actions/jwt-token-generator";
import { passwordGenerator } from "./actions/password-generator";

// Real Monitoring & Observability
import { httpMonitor } from "./actions/http-monitor";
import { logParser } from "./actions/log-parser";

// Advanced Logic
import { jsonPathExtractor } from "./logic/json-path-extractor";
import { templateEngine } from "./logic/template-engine";

// Communication Upgrades
import { whatsappSendMessage } from "./actions/whatsapp-send-message";

// E-commerce & Payments
import { shopifyCreateProduct } from "./actions/shopify-create-product";

// ============================================
// INTEGRATION REGISTRY CLASS
// ============================================

class IntegrationRegistry {
  private integrations = new Map<string, Integration>();

  constructor() {
    // Register all integrations
    this.registerIntegrations([
      // Triggers
      manualTrigger,
      webhookTrigger,
      scheduleTrigger,
      emailTrigger,
      formTrigger,
      databaseTrigger,
      fileWatcherTrigger,

      // Actions
      slackSendMessage,
      setVariable,
      emailSend,
      apiRequest,
      delay,
      aiIntegration,

      // Communication & Messaging
      discordSendMessage,
      teamsSendMessage,
      telegramSendMessage,

      // Databases & Storage
      postgresInsert,
      sheetsAppendRow,
      airtableCreateRecord,
      googleSheetsAppend,
      databaseInsert,
      databaseSelect,

      // Payments & Finance
      stripeCreatePayment,
      paypalSendPayment,

      // CRM & Sales
      hubspotCreateContact,
      salesforceCreateLead,

      // Project Management
      asanaCreateTask,
      trelloCreateCard,

      // Cloud Storage
      s3UploadFile,
      driveUploadFile,

      // Email Marketing
      mailchimpAddSubscriber,
      sendgridSendEmail,

      // Social Media
      twitterPostTweet,
      linkedinCreatePost,

      // Development Tools
      githubCreateIssue,
      jiraCreateIssue,

      // Business Tools
      zoomCreateMeeting,
      notionCreatePage,

      // Additional Integrations
      smsSend,
      redisSet,
      cloudinaryUploadImage,

      // Calendar & Scheduling
      googleCalendarCreateEvent,
      calendlyCreateBooking,
      outlookCalendarCreateEvent,

      // File Processing & Data
      csvParser,
      pdfGenerator,
      imageProcessor,

      // Authentication & Security
      jwtTokenGenerator,
      passwordGenerator,

      // Real Monitoring & Observability
      httpMonitor,
      logParser,

      // Advanced Logic
      jsonPathExtractor,
      templateEngine,

      // Communication Upgrades
      whatsappSendMessage,

      // E-commerce & Payments
      shopifyCreateProduct,

      // Logic
      filterCondition,
      branchCondition,
      transformData,
      iteratorLoop,
      switchCase,
      dataValidator,
      aggregator,
      router,
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

    // ----  NEW: interpolate expressions inside config (repeat until stable) ----
    const hydrate = (value: unknown): unknown => {
      const seen = new Set<string>();
      let out: unknown = value;
      while (typeof out === "string" && !seen.has(out)) {
        seen.add(out);
        // Branch-condition needs strings to be quoted _inside_ the JS expression
        const quote = integration.id === "branch_condition";
        out = parseExpression(out, context, quote);
      }
      if (Array.isArray(out)) return out.map(hydrate);
      if (out && typeof out === "object" && out !== null)
        return Object.fromEntries(
          Object.entries(out as Record<string, unknown>).map(([k, v]) => [
            k,
            hydrate(v),
          ])
        );
      return out;
    };
    const interpolatedConfig = hydrate(config) as Record<string, unknown>;

    try {
      const startTime = Date.now();
      const result = await integration.executor.execute(
        interpolatedConfig,
        context
      );
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

// Export the registry class for advanced usage
export { IntegrationRegistry };
