import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const apiRequest: Integration = createIntegration({
  id: "api_request",
  name: "API Request",
  category: "action",
  description: "Make an HTTP API request",
  icon: "globe",
  version: "1.0.0",

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
});
