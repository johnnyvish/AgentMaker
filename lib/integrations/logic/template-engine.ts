import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const templateEngine: Integration = createIntegration({
  id: "template_engine",
  name: "Template Engine",
  category: "logic",
  description: "Generate text/HTML from templates with variable substitution",
  icon: "file-text",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "template",
        type: "textarea",
        label: "Template",
        placeholder: "Hello {{name}}, your order #{{order_id}} has been shipped to {{address}}.",
        required: true,
        supportExpressions: true,
      },
      {
        key: "variables",
        type: "textarea",
        label: "Variables (JSON)",
        placeholder: '{"name": "John", "order_id": "12345", "address": "123 Main St"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "template_type",
        type: "select",
        label: "Template Type",
        required: false,
        options: [
          { label: "Text", value: "text" },
          { label: "HTML", value: "html" },
          { label: "Email", value: "email" },
          { label: "Markdown", value: "markdown" },
          { label: "JSON", value: "json" },
        ],
      },
      {
        key: "variable_syntax",
        type: "select",
        label: "Variable Syntax",
        required: false,
        options: [
          { label: "Handlebars {{variable}}", value: "handlebars" },
          { label: "Mustache {{variable}}", value: "mustache" },
          { label: "Dollar {{$variable}}", value: "dollar" },
          { label: "Percent %variable%", value: "percent" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        key: "custom_syntax",
        type: "text",
        label: "Custom Syntax (start,end)",
        placeholder: "{{,}}",
        required: false,
      },
      {
        key: "default_values",
        type: "textarea",
        label: "Default Values (JSON)",
        placeholder: '{"name": "Guest", "order_id": "N/A"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "escape_html",
        type: "boolean",
        label: "Escape HTML",
        required: false,
      },
      {
        key: "preserve_whitespace",
        type: "boolean",
        label: "Preserve Whitespace",
        required: false,
      },
      {
        key: "conditional_logic",
        type: "boolean",
        label: "Enable Conditional Logic",
        required: false,
      },
      {
        key: "loops",
        type: "boolean",
        label: "Enable Loops",
        required: false,
      },
      {
        key: "output_format",
        type: "select",
        label: "Output Format",
        required: false,
        options: [
          { label: "Plain Text", value: "text" },
          { label: "HTML", value: "html" },
          { label: "JSON", value: "json" },
          { label: "Base64", value: "base64" },
        ],
      },
    ],
    required: ["template"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const timestamp = new Date().toISOString();
      
      const template = config.template as string;
      const templateType = (config.template_type as string) || "text";
      const variableSyntax = (config.variable_syntax as string) || "handlebars";
      const customSyntax = config.custom_syntax as string || "";
      const escapeHtml = (config.escape_html as boolean) || false;
      const preserveWhitespace = (config.preserve_whitespace as boolean) || false;
      const conditionalLogic = (config.conditional_logic as boolean) || false;
      const loops = (config.loops as boolean) || false;
      const outputFormat = (config.output_format as string) || "text";

      let variables = {};
      if (config.variables) {
        try {
          variables = JSON.parse(config.variables as string);
        } catch {
          variables = {};
        }
      }

      let defaultValues = {};
      if (config.default_values) {
        try {
          defaultValues = JSON.parse(config.default_values as string);
        } catch {
          defaultValues = {};
        }
      }

      // Mock template processing
      let processedTemplate = template;
      const allVariables = { ...defaultValues, ...variables };
      
      // Simple variable substitution
      for (const [key, value] of Object.entries(allVariables)) {
        const patterns = this.getVariablePatterns(variableSyntax, customSyntax);
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.replace('{{variable}}', `{{${key}}}`), 'g');
          processedTemplate = processedTemplate.replace(regex, String(value));
        }
      }

      // Apply template type formatting
      switch (templateType) {
        case "html":
          processedTemplate = this.formatAsHtml(processedTemplate);
          break;
        case "email":
          processedTemplate = this.formatAsEmail(processedTemplate);
          break;
        case "markdown":
          processedTemplate = this.formatAsMarkdown(processedTemplate);
          break;
        case "json":
          processedTemplate = this.formatAsJson(processedTemplate, allVariables);
          break;
      }

      // Apply output formatting
      let finalOutput = processedTemplate;
      switch (outputFormat) {
        case "html":
          finalOutput = `<div>${processedTemplate}</div>`;
          break;
        case "json":
          finalOutput = JSON.stringify({ content: processedTemplate, variables: allVariables });
          break;
        case "base64":
          finalOutput = btoa(processedTemplate);
          break;
      }

      const engineId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        data: {
          engineId,
          template,
          templateType,
          variableSyntax,
          customSyntax: customSyntax || null,
          variables: allVariables,
          defaultValues,
          escapeHtml,
          preserveWhitespace,
          conditionalLogic,
          loops,
          outputFormat,
          processedTemplate,
          finalOutput,
          variableCount: Object.keys(allVariables).length,
          substitutionCount: this.countSubstitutions(template, allVariables),
          timestamp,
        },
        metadata: { nodeType: "logic", subtype: "template_engine" },
      };
    },

    getVariablePatterns(syntax: string, custom: string): string[] {
      switch (syntax) {
        case "handlebars":
        case "mustache":
          return ["{{variable}}"];
        case "dollar":
          return ["{{$variable}}"];
        case "percent":
          return ["%variable%"];
        case "custom":
          if (custom) {
            const [start, end] = custom.split(",");
            return [`${start}variable${end}`];
          }
          return ["{{variable}}"];
        default:
          return ["{{variable}}"];
      }
    },

    formatAsHtml(template: string): string {
      return template
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
    },

    formatAsEmail(template: string): string {
      return `
        <html>
          <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${this.formatAsHtml(template)}
            </div>
          </body>
        </html>
      `.trim();
    },

    formatAsMarkdown(template: string): string {
      return template
        .replace(/\*\*(.*?)\*\*/g, "**$1**")
        .replace(/\*(.*?)\*/g, "*$1*")
        .replace(/\n/g, "\n\n");
    },

    formatAsJson(template: string, variables: Record<string, unknown>): string {
      return JSON.stringify({
        template: template,
        variables: variables,
        processed: template,
      }, null, 2);
    },

    countSubstitutions(template: string, variables: Record<string, unknown>): number {
      let count = 0;
      for (const key of Object.keys(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const matches = template.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
      return count;
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.template) {
        errors.template = "Template is required";
      }

      if (config.variables) {
        try {
          JSON.parse(config.variables as string);
        } catch {
          errors.variables = "Variables must be a valid JSON object";
        }
      }

      if (config.default_values) {
        try {
          JSON.parse(config.default_values as string);
        } catch {
          errors.default_values = "Default values must be a valid JSON object";
        }
      }

      if (config.variable_syntax === "custom" && !config.custom_syntax) {
        errors.custom_syntax = "Custom syntax is required when using custom variable syntax";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 