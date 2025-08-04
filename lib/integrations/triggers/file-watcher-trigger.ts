import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const fileWatcherTrigger: Integration = createIntegration({
  id: "file_watcher_trigger",
  name: "File Watcher",
  category: "trigger",
  description: "Trigger when files are created, modified, or deleted",
  icon: "file-search",
  version: "1.0.0",

  hasInputHandle: false,

  schema: {
    fields: [
      {
        key: "path",
        type: "text",
        label: "Directory Path",
        placeholder: "/uploads/ or C:\\uploads\\",
        required: true,
      },
      {
        key: "events",
        type: "select",
        label: "Watch Events",
        required: true,
        options: [
          { label: "Created", value: "created" },
          { label: "Modified", value: "modified" },
          { label: "Deleted", value: "deleted" },
          { label: "All Events", value: "all" },
        ],
      },
      {
        key: "file_pattern",
        type: "text",
        label: "File Pattern (regex)",
        placeholder: ".*\\.csv$ or .*\\.(jpg|png|gif)$",
        required: false,
      },
      {
        key: "recursive",
        type: "boolean",
        label: "Watch Subdirectories",
        required: false,
      },
      {
        key: "include_file_info",
        type: "boolean",
        label: "Include File Information",
        required: false,
      },
      {
        key: "max_file_size",
        type: "number",
        label: "Max File Size (MB)",
        placeholder: "100",
        required: false,
      },
      {
        key: "ignore_patterns",
        type: "textarea",
        label: "Ignore Patterns (JSON array)",
        placeholder: '["*.tmp", "*.log", ".DS_Store"]',
        required: false,
        validation: (value: unknown) => {
          if (!value) return null;
          if (typeof value !== "string") {
            return "Ignore patterns must be a JSON string";
          }
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              return "Ignore patterns must be a JSON array";
            }
            return null;
          } catch (_e) {
            return "Invalid JSON format";
          }
        },
      },
    ],
    required: ["path", "events"],
  },

  executor: {
    async execute(config) {
      // Simulate file watching delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const path = config.path as string;
      const events = config.events as string;
      const filePattern = config.file_pattern as string;
      const recursive = (config.recursive as boolean) || false;
      const includeFileInfo = (config.include_file_info as boolean) || false;
      const maxFileSize = (config.max_file_size as number) || 100;

      let ignorePatterns: string[] = [];
      if (config.ignore_patterns) {
        try {
          ignorePatterns = JSON.parse(config.ignore_patterns as string);
        } catch (e) {
          return {
            success: false,
            error: "Invalid ignore patterns JSON format",
            data: {
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "trigger", subtype: "file_watcher_trigger" },
          };
        }
      }

      // Mock file events
      const mockFileEvents = [
        {
          event_type: "created",
          file_path: path + "data_2024_01_15.csv",
          file_name: "data_2024_01_15.csv",
          file_size: 1024000, // 1MB
          file_extension: ".csv",
          modified_time: new Date().toISOString(),
          created_time: new Date().toISOString(),
          is_directory: false,
          relative_path: "data_2024_01_15.csv",
          absolute_path: path + "data_2024_01_15.csv",
          file_info: includeFileInfo
            ? {
                permissions: "rw-r--r--",
                owner: "user",
                group: "users",
                inode: 12345,
                device: 1,
                hard_links: 1,
                access_time: new Date().toISOString(),
                change_time: new Date().toISOString(),
              }
            : null,
        },
        {
          event_type: "modified",
          file_path: path + "config.json",
          file_name: "config.json",
          file_size: 2048,
          file_extension: ".json",
          modified_time: new Date().toISOString(),
          created_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          is_directory: false,
          relative_path: "config.json",
          absolute_path: path + "config.json",
          file_info: includeFileInfo
            ? {
                permissions: "rw-r--r--",
                owner: "user",
                group: "users",
                inode: 12346,
                device: 1,
                hard_links: 1,
                access_time: new Date().toISOString(),
                change_time: new Date().toISOString(),
              }
            : null,
        },
        {
          event_type: "created",
          file_path: path + "images/logo.png",
          file_name: "logo.png",
          file_size: 512000, // 512KB
          file_extension: ".png",
          modified_time: new Date().toISOString(),
          created_time: new Date().toISOString(),
          is_directory: false,
          relative_path: "images/logo.png",
          absolute_path: path + "images/logo.png",
          file_info: includeFileInfo
            ? {
                permissions: "rw-r--r--",
                owner: "user",
                group: "users",
                inode: 12347,
                device: 1,
                hard_links: 1,
                access_time: new Date().toISOString(),
                change_time: new Date().toISOString(),
              }
            : null,
        },
      ];

      // Filter events based on events setting
      let filteredEvents = mockFileEvents;
      if (events !== "all") {
        filteredEvents = mockFileEvents.filter(
          (event) => event.event_type === events
        );
      }

      // Apply file pattern filter if specified
      if (filePattern) {
        try {
          const regex = new RegExp(filePattern);
          filteredEvents = filteredEvents.filter((event) =>
            regex.test(event.file_name)
          );
        } catch (_e) {
          return {
            success: false,
            error: "Invalid file pattern regex",
            data: {
              pattern: filePattern,
              timestamp: new Date().toISOString(),
            },
            metadata: { nodeType: "trigger", subtype: "file_watcher_trigger" },
          };
        }
      }

      // Apply ignore patterns
      if (ignorePatterns.length > 0) {
        filteredEvents = filteredEvents.filter((event) => {
          return !ignorePatterns.some((pattern) => {
            // Simple glob-like pattern matching
            const regexPattern = pattern
              .replace(/\./g, "\\.")
              .replace(/\*/g, ".*")
              .replace(/\?/g, ".");
            const regex = new RegExp(regexPattern);
            return regex.test(event.file_name);
          });
        });
      }

      // Apply max file size filter
      filteredEvents = filteredEvents.filter((event) => {
        const fileSizeMB = event.file_size / (1024 * 1024);
        return fileSizeMB <= maxFileSize;
      });

      // Apply recursive filter
      if (!recursive) {
        filteredEvents = filteredEvents.filter((event) => {
          return (
            !event.relative_path.includes("/") &&
            !event.relative_path.includes("\\")
          );
        });
      }

      return {
        success: true,
        data: {
          events: filteredEvents,
          total_events: filteredEvents.length,
          path,
          watch_events: events,
          file_pattern: filePattern || null,
          recursive,
          include_file_info: includeFileInfo,
          max_file_size_mb: maxFileSize,
          ignore_patterns: ignorePatterns.length > 0 ? ignorePatterns : null,
          trigger_time: new Date().toISOString(),
        },
        metadata: { nodeType: "trigger", subtype: "file_watcher_trigger" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.path) {
        errors.path = "Directory path is required";
      } else if (
        typeof config.path !== "string" ||
        config.path.trim().length === 0
      ) {
        errors.path = "Directory path must be a non-empty string";
      }

      if (!config.events) {
        errors.events = "Watch events are required";
      }

      if (config.file_pattern) {
        try {
          new RegExp(config.file_pattern as string);
        } catch (_e) {
          errors.file_pattern = "Invalid file pattern regex";
        }
      }

      if (
        config.max_file_size &&
        (typeof config.max_file_size !== "number" || config.max_file_size <= 0)
      ) {
        errors.max_file_size = "Max file size must be a positive number";
      }

      if (config.ignore_patterns) {
        try {
          const parsed = JSON.parse(config.ignore_patterns as string);
          if (!Array.isArray(parsed)) {
            errors.ignore_patterns = "Ignore patterns must be a JSON array";
          }
        } catch (_e) {
          errors.ignore_patterns = "Invalid JSON format for ignore patterns";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
});
