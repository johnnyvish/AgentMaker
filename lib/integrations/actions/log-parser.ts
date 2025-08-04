import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const logParser: Integration = createIntegration({
  id: "log_parser",
  name: "Log Parser",
  category: "action",
  description: "Parse log files, extract errors, send alerts",
  icon: "file-text",
  version: "1.0.0",

  schema: {
    fields: [
      {
        key: "log_content",
        type: "textarea",
        label: "Log Content",
        placeholder:
          "2024-12-01 10:30:15 [ERROR] Database connection failed\n2024-12-01 10:30:16 [INFO] Retrying connection...",
        required: true,
        supportExpressions: true,
      },
      {
        key: "log_format",
        type: "select",
        label: "Log Format",
        required: false,
        options: [
          { label: "Auto Detect", value: "auto" },
          { label: "JSON", value: "json" },
          { label: "Common Log Format", value: "clf" },
          { label: "Combined Log Format", value: "combined" },
          { label: "Syslog", value: "syslog" },
          { label: "Custom Regex", value: "regex" },
        ],
      },
      {
        key: "custom_regex",
        type: "text",
        label: "Custom Regex Pattern",
        placeholder:
          "(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(\\w+)\\] (.+)",
        required: false,
      },
      {
        key: "error_patterns",
        type: "textarea",
        label: "Error Patterns (JSON array)",
        placeholder: '["ERROR", "FATAL", "CRITICAL", "Exception", "Failed"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "warning_patterns",
        type: "textarea",
        label: "Warning Patterns (JSON array)",
        placeholder: '["WARN", "Warning", "Deprecated", "Timeout"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "extract_fields",
        type: "text",
        label: "Fields to Extract (comma-separated)",
        placeholder: "timestamp,level,message,user_id,ip_address",
        required: false,
      },
      {
        key: "time_range",
        type: "text",
        label: "Time Range Filter",
        placeholder: "2024-12-01 10:00:00 to 2024-12-01 11:00:00",
        required: false,
        supportExpressions: true,
      },
      {
        key: "min_severity",
        type: "select",
        label: "Minimum Severity",
        required: false,
        options: [
          { label: "DEBUG", value: "debug" },
          { label: "INFO", value: "info" },
          { label: "WARN", value: "warn" },
          { label: "ERROR", value: "error" },
          { label: "FATAL", value: "fatal" },
        ],
      },
      {
        key: "group_by",
        type: "text",
        label: "Group By Field",
        placeholder: "level or user_id or ip_address",
        required: false,
      },
      {
        key: "limit_results",
        type: "number",
        label: "Limit Results",
        placeholder: "100",
        required: false,
      },
      {
        key: "send_alerts",
        type: "boolean",
        label: "Send Alerts for Errors",
        required: false,
      },
      {
        key: "alert_threshold",
        type: "number",
        label: "Alert Threshold (error count)",
        placeholder: "5",
        required: false,
      },
    ],
    required: ["log_content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const timestamp = new Date().toISOString();

      const logContent = config.log_content as string;
      const logFormat = (config.log_format as string) || "auto";
      const customRegex = (config.custom_regex as string) || "";
      const extractFields = (config.extract_fields as string) || "";
      const timeRange = (config.time_range as string) || "";
      const minSeverity = (config.min_severity as string) || "debug";
      const groupBy = (config.group_by as string) || "";
      const limitResults = (config.limit_results as number) || 100;
      const sendAlerts = (config.send_alerts as boolean) || false;
      const alertThreshold = (config.alert_threshold as number) || 5;

      let errorPatterns = ["ERROR", "FATAL", "CRITICAL", "Exception", "Failed"];
      if (config.error_patterns) {
        try {
          errorPatterns = JSON.parse(config.error_patterns as string);
        } catch {
          errorPatterns = ["ERROR", "FATAL", "CRITICAL", "Exception", "Failed"];
        }
      }

      let warningPatterns = ["WARN", "Warning", "Deprecated", "Timeout"];
      if (config.warning_patterns) {
        try {
          warningPatterns = JSON.parse(config.warning_patterns as string);
        } catch {
          warningPatterns = ["WARN", "Warning", "Deprecated", "Timeout"];
        }
      }

      // Mock log parsing
      const lines = logContent.split("\n").filter((line) => line.trim() !== "");
      const parsedLogs = [];
      let errorCount = 0;
      let warningCount = 0;
      let infoCount = 0;

      for (let i = 0; i < Math.min(lines.length, limitResults); i++) {
        const line = lines[i];
        const isError = errorPatterns.some((pattern) => line.includes(pattern));
        const isWarning = warningPatterns.some((pattern) =>
          line.includes(pattern)
        );

        if (isError) errorCount++;
        else if (isWarning) warningCount++;
        else infoCount++;

        const logEntry = {
          line_number: i + 1,
          timestamp: new Date(
            Date.now() - Math.random() * 86400000
          ).toISOString(),
          level: isError ? "ERROR" : isWarning ? "WARN" : "INFO",
          message: line,
          raw_line: line,
          severity: isError ? 4 : isWarning ? 3 : 2,
        };

        parsedLogs.push(logEntry);
      }

      // Group results if specified
      let groupedResults: Record<string, unknown[]> | null = null;
      if (groupBy) {
        groupedResults = {};
        parsedLogs.forEach((log) => {
          const key =
            ((log as Record<string, unknown>)[groupBy] as string) || "unknown";
          if (!groupedResults![key]) {
            groupedResults![key] = [];
          }
          groupedResults![key].push(log);
        });
      }

      // Check if alerts should be sent
      const shouldAlert = sendAlerts && errorCount >= alertThreshold;
      const alertMessage = shouldAlert
        ? `High error count detected: ${errorCount} errors in the last log check`
        : null;

      const parserId = `log_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        success: true,
        data: {
          parserId,
          logFormat,
          customRegex: customRegex || null,
          extractFields: extractFields
            ? extractFields.split(",").map((f) => f.trim())
            : null,
          timeRange: timeRange || null,
          minSeverity,
          groupBy: groupBy || null,
          limitResults,
          totalLines: lines.length,
          parsedLines: parsedLogs.length,
          errorCount,
          warningCount,
          infoCount,
          parsedLogs,
          groupedResults,
          errorPatterns,
          warningPatterns,
          sendAlerts,
          alertThreshold,
          shouldAlert,
          alertMessage,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "log_parser" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.log_content) {
        errors.log_content = "Log content is required";
      }

      if (config.log_format === "regex" && !config.custom_regex) {
        errors.custom_regex =
          "Custom regex pattern is required when using regex format";
      }

      if (config.error_patterns) {
        try {
          JSON.parse(config.error_patterns as string);
        } catch {
          errors.error_patterns = "Error patterns must be a valid JSON array";
        }
      }

      if (config.warning_patterns) {
        try {
          JSON.parse(config.warning_patterns as string);
        } catch {
          errors.warning_patterns =
            "Warning patterns must be a valid JSON array";
        }
      }

      if (
        config.limit_results &&
        (typeof config.limit_results !== "number" || config.limit_results <= 0)
      ) {
        errors.limit_results = "Limit results must be a positive number";
      }

      if (
        config.alert_threshold &&
        (typeof config.alert_threshold !== "number" ||
          config.alert_threshold <= 0)
      ) {
        errors.alert_threshold = "Alert threshold must be a positive number";
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
