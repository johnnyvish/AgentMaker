import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const airtableCreateRecord: Integration = createIntegration({
  id: "airtable_create_record",
  name: "Airtable Create Record",
  category: "action",
  description: "Create records in Airtable base",
  icon: "airtable",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "base_id",
        type: "text",
        label: "Base ID",
        placeholder: "appXXXXXXXXXXXXXX",
        required: true,
      },
      {
        key: "table_id",
        type: "text",
        label: "Table ID",
        placeholder: "tblXXXXXXXXXXXXXX",
        required: true,
      },
      {
        key: "fields",
        type: "textarea",
        label: "Fields (JSON)",
        placeholder: '{"Name": "John Doe", "Email": "john@example.com", "Status": "Active"}',
        required: true,
        supportExpressions: true,
      },
      {
        key: "typecast",
        type: "boolean",
        label: "Enable Type Casting",
        required: false,
      },
    ],
    required: ["base_id", "table_id", "fields"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          recordId: "recXXXXXXXXXXXXXX",
          baseId: config.base_id as string,
          tableId: config.table_id as string,
          fields: JSON.parse(config.fields as string),
          createdTime: timestamp,
          typecast: config.typecast as boolean || false,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "airtable_create_record" },
      };
    },
  },
}); 