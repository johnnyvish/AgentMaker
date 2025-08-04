import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const formTrigger: Integration = createIntegration({
  id: "form_trigger",
  name: "Form Submission",
  category: "trigger",
  description: "Trigger when forms are submitted",
  icon: "clipboard",
  version: "1.0.0",
  
  hasInputHandle: false,
  
  schema: {
    fields: [
      {
        key: "form_id",
        type: "text",
        label: "Form ID",
        placeholder: "contact-form-2024",
        required: true,
      },
      {
        key: "webhook_url",
        type: "url",
        label: "Webhook URL (generated)",
        placeholder: "https://api.yourapp.com/webhooks/forms/xyz123",
        required: false,
      },
      {
        key: "field_filters",
        type: "textarea",
        label: "Field Filters (JSON)",
        placeholder: '{"email": "required", "name": "required", "priority": "high"}',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Field filters must be a JSON string";
          }
          try {
            JSON.parse(value);
            return null;
          } catch (e) {
            return "Invalid JSON format";
          }
        },
      },
      {
        key: "include_metadata",
        type: "boolean",
        label: "Include Submission Metadata",
        required: false,
      },
      {
        key: "validate_fields",
        type: "boolean",
        label: "Validate Required Fields",
        required: false,
      },
    ],
    required: ["form_id"],
  },

  executor: {
    async execute(config) {
      // Simulate form processing delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const formId = config.form_id as string;
      const includeMetadata = config.include_metadata as boolean || false;
      const validateFields = config.validate_fields as boolean || false;
      
      let fieldFilters = {};
      if (config.field_filters) {
        try {
          fieldFilters = JSON.parse(config.field_filters as string);
        } catch (e) {
          return {
            success: false,
            error: "Invalid field filters JSON format",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "trigger", subtype: "form_trigger" },
          };
        }
      }

      // Mock form submission data
      const mockSubmission = {
        form_id: formId,
        submission_id: "sub_" + Date.now(),
        submitted_at: new Date().toISOString(),
        fields: {
          name: "John Doe",
          email: "john@example.com", 
          message: "I'm interested in your product and would like to schedule a demo. Please contact me at your earliest convenience.",
          phone: "+1-555-0123",
          company: "Acme Corporation",
          priority: "high",
          budget: "50000-100000",
          timeline: "3 months"
        },
        metadata: includeMetadata ? {
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ip_address: "192.168.1.100",
          referrer: "https://google.com/search?q=automation+platform",
          language: "en-US",
          timezone: "America/New_York",
          screen_resolution: "1920x1080",
          form_load_time: "1.2s",
          form_submit_time: "0.8s",
          session_id: "sess_" + Math.random().toString(36).substr(2, 9),
          utm_source: "google",
          utm_medium: "cpc",
          utm_campaign: "automation_2024"
        } : {},
        validation: validateFields ? {
          is_valid: true,
          errors: [],
          warnings: []
        } : null
      };

      // Apply field filters if specified
      if (Object.keys(fieldFilters).length > 0) {
        const filteredFields: Record<string, unknown> = {};
        for (const [fieldName, filterValue] of Object.entries(fieldFilters)) {
          if (fieldName in mockSubmission.fields) {
            filteredFields[fieldName] = mockSubmission.fields[fieldName as keyof typeof mockSubmission.fields];
          }
        }
        mockSubmission.fields = filteredFields as typeof mockSubmission.fields;
      }

      return {
        success: true,
        data: {
          ...mockSubmission,
          webhook_url: config.webhook_url || null,
          field_filters: Object.keys(fieldFilters).length > 0 ? fieldFilters : null,
          include_metadata: includeMetadata,
          validate_fields: validateFields,
          trigger_time: new Date().toISOString(),
        },
        metadata: { nodeType: "trigger", subtype: "form_trigger" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.form_id) {
        errors.form_id = "Form ID is required";
      } else if (typeof config.form_id !== "string" || config.form_id.trim().length === 0) {
        errors.form_id = "Form ID must be a non-empty string";
      }

      if (config.field_filters) {
        try {
          const parsed = JSON.parse(config.field_filters as string);
          if (typeof parsed !== "object" || parsed === null) {
            errors.field_filters = "Field filters must be a JSON object";
          }
        } catch (e) {
          errors.field_filters = "Invalid JSON format for field filters";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 