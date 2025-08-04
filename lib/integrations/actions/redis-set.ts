import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const redisSet: Integration = createIntegration({
  id: "redis_set",
  name: "Redis Set",
  category: "action",
  description: "Set key-value pairs in Redis",
  icon: "redis",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "host",
        type: "text",
        label: "Redis Host",
        placeholder: "localhost",
        required: true,
      },
      {
        key: "port",
        type: "number",
        label: "Redis Port",
        placeholder: "6379",
        required: false,
      },
      {
        key: "key",
        type: "text",
        label: "Key",
        placeholder: "user:123:profile",
        required: true,
        supportExpressions: true,
      },
      {
        key: "value",
        type: "textarea",
        label: "Value",
        placeholder: "Value to store",
        required: true,
        supportExpressions: true,
      },
      {
        key: "ttl",
        type: "number",
        label: "TTL (seconds)",
        placeholder: "3600",
        required: false,
      },
      {
        key: "expire_mode",
        type: "select",
        label: "Expire Mode",
        required: false,
        options: [
          { label: "EX (seconds)", value: "EX" },
          { label: "PX (milliseconds)", value: "PX" },
          { label: "EXAT (timestamp)", value: "EXAT" },
          { label: "PXAT (timestamp ms)", value: "PXAT" },
        ],
      },
    ],
    required: ["host", "key", "value"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          host: config.host as string,
          port: (config.port as number) || 6379,
          key: config.key as string,
          value: config.value as string,
          ttl: (config.ttl as number) || null,
          expireMode: (config.expire_mode as string) || "EX",
          result: "OK",
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "redis_set" },
      };
    },
  },
});
