import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const salesforceCreateLead: Integration = createIntegration({
  id: "salesforce_create_lead",
  name: "Salesforce Create Lead",
  category: "action",
  description: "Create leads in Salesforce",
  icon: "salesforce",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "firstname",
        type: "text",
        label: "First Name",
        placeholder: "John",
        required: true,
        supportExpressions: true,
      },
      {
        key: "lastname",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
        required: true,
        supportExpressions: true,
      },
      {
        key: "email",
        type: "email",
        label: "Email",
        placeholder: "john.doe@example.com",
        required: true,
      },
      {
        key: "company",
        type: "text",
        label: "Company",
        placeholder: "Acme Corporation",
        required: true,
        supportExpressions: true,
      },
      {
        key: "phone",
        type: "text",
        label: "Phone",
        placeholder: "+1-555-123-4567",
        required: false,
      },
      {
        key: "title",
        type: "text",
        label: "Title",
        placeholder: "VP of Engineering",
        required: false,
      },
      {
        key: "lead_source",
        type: "select",
        label: "Lead Source",
        required: false,
        options: [
          { label: "Web", value: "Web" },
          { label: "Phone Inquiry", value: "Phone Inquiry" },
          { label: "Email", value: "Email" },
          { label: "Campaign", value: "Campaign" },
          { label: "Partner", value: "Partner" },
          { label: "Other", value: "Other" },
        ],
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        required: false,
        options: [
          { label: "New", value: "New" },
          { label: "Contacted", value: "Contacted" },
          { label: "Qualified", value: "Qualified" },
          { label: "Unqualified", value: "Unqualified" },
        ],
      },
    ],
    required: ["firstname", "lastname", "email", "company"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          leadId: "00Q1234567890ABCD",
          firstname: config.firstname as string,
          lastname: config.lastname as string,
          email: config.email as string,
          company: config.company as string,
          phone: config.phone as string || "",
          title: config.title as string || "",
          leadSource: config.lead_source as string || "Web",
          status: config.status as string || "New",
          createdDate: timestamp,
          lastModifiedDate: timestamp,
          systemModstamp: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "salesforce_create_lead" },
      };
    },
  },
}); 