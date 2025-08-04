import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const httpMonitor: Integration = createIntegration({
  id: "http_monitor",
  name: "HTTP Monitor",
  category: "action",
  description: "Check website uptime, response times, status codes",
  icon: "activity",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "url",
        type: "url",
        label: "URL to Monitor",
        placeholder: "https://example.com",
        required: true,
        supportExpressions: true,
      },
      {
        key: "method",
        type: "select",
        label: "HTTP Method",
        required: false,
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
          { label: "HEAD", value: "HEAD" },
        ],
      },
      {
        key: "timeout",
        type: "number",
        label: "Timeout (seconds)",
        placeholder: "30",
        required: false,
      },
      {
        key: "expected_status",
        type: "number",
        label: "Expected Status Code",
        placeholder: "200",
        required: false,
      },
      {
        key: "check_ssl",
        type: "boolean",
        label: "Check SSL Certificate",
        required: false,
      },
      {
        key: "follow_redirects",
        type: "boolean",
        label: "Follow Redirects",
        required: false,
      },
      {
        key: "headers",
        type: "textarea",
        label: "Custom Headers (JSON)",
        placeholder: '{"User-Agent": "MonitorBot/1.0", "Accept": "application/json"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "body",
        type: "textarea",
        label: "Request Body",
        placeholder: '{"key": "value"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "check_content",
        type: "text",
        label: "Content to Check For",
        placeholder: "Welcome to our site",
        required: false,
        supportExpressions: true,
      },
      {
        key: "alert_on_failure",
        type: "boolean",
        label: "Alert on Failure",
        required: false,
      },
    ],
    required: ["url"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const timestamp = new Date().toISOString();
      
      const url = config.url as string;
      const method = (config.method as string) || "GET";
      const timeout = (config.timeout as number) || 30;
      const expectedStatus = (config.expected_status as number) || 200;
      const checkSSL = (config.check_ssl as boolean) || false;
      const followRedirects = (config.follow_redirects as boolean) !== false;
      const checkContent = config.check_content as string || "";
      const alertOnFailure = (config.alert_on_failure as boolean) || false;

      let headers = {};
      if (config.headers) {
        try {
          headers = JSON.parse(config.headers as string);
        } catch {
          headers = {};
        }
      }

      // Mock HTTP response
      const responseTime = Math.floor(Math.random() * 2000) + 100; // 100-2100ms
      const statusCode = Math.random() > 0.1 ? expectedStatus : 500; // 90% success rate
      const isUp = statusCode >= 200 && statusCode < 400;
      const sslValid = checkSSL ? Math.random() > 0.05 : true; // 95% SSL valid rate
      const contentFound = checkContent ? Math.random() > 0.2 : true; // 80% content found rate

      const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        data: {
          monitorId,
          url,
          method,
          statusCode,
          responseTime,
          isUp,
          sslValid,
          contentFound,
          expectedStatus,
          timeout,
          followRedirects,
          headers,
          body: config.body as string || "",
          checkContent,
          alertOnFailure,
          timestamp,
          lastChecked: timestamp,
          uptime: Math.random() * 100, // 0-100%
          responseSize: Math.floor(Math.random() * 100000) + 1000, // 1KB-100KB
          redirectCount: followRedirects ? Math.floor(Math.random() * 3) : 0,
          sslExpiry: checkSSL ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : null,
        },
        metadata: { nodeType: "action", subtype: "http_monitor" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.url) {
        errors.url = "URL is required";
      }

      if (config.timeout && (typeof config.timeout !== "number" || config.timeout <= 0)) {
        errors.timeout = "Timeout must be a positive number";
      }

      if (config.expected_status && (typeof config.expected_status !== "number" || config.expected_status < 100 || config.expected_status > 599)) {
        errors.expected_status = "Expected status must be a valid HTTP status code";
      }

      if (config.headers) {
        try {
          JSON.parse(config.headers as string);
        } catch {
          errors.headers = "Headers must be a valid JSON object";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 