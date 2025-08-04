import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const hubspotCreateContact: Integration = createIntegration({
  id: "hubspot_create_contact",
  name: "HubSpot Create Contact",
  category: "action",
  description: "Create contacts in HubSpot CRM",
  icon: "hubspot",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "email",
        type: "email",
        label: "Email",
        placeholder: "contact@example.com",
        required: true,
      },
      {
        key: "firstname",
        type: "text",
        label: "First Name",
        placeholder: "John",
        required: false,
        supportExpressions: true,
      },
      {
        key: "lastname",
        type: "text",
        label: "Last Name",
        placeholder: "Doe",
        required: false,
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
        key: "company",
        type: "text",
        label: "Company",
        placeholder: "Acme Corp",
        required: false,
        supportExpressions: true,
      },
      {
        key: "jobtitle",
        type: "text",
        label: "Job Title",
        placeholder: "Software Engineer",
        required: false,
      },
      {
        key: "lifecyclestage",
        type: "select",
        label: "Lifecycle Stage",
        required: false,
        options: [
          { label: "Lead", value: "lead" },
          {
            label: "Marketing Qualified Lead",
            value: "marketingqualifiedlead",
          },
          { label: "Sales Qualified Lead", value: "salesqualifiedlead" },
          { label: "Opportunity", value: "opportunity" },
          { label: "Customer", value: "customer" },
          { label: "Evangelist", value: "evangelist" },
          { label: "Other", value: "other" },
        ],
      },
    ],
    required: ["email"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          contactId: 12345,
          email: config.email as string,
          firstname: (config.firstname as string) || "",
          lastname: (config.lastname as string) || "",
          phone: (config.phone as string) || "",
          company: (config.company as string) || "",
          jobtitle: (config.jobtitle as string) || "",
          lifecyclestage: (config.lifecyclestage as string) || "lead",
          createdAt: timestamp,
          updatedAt: timestamp,
          properties: {
            email: config.email as string,
            firstname: (config.firstname as string) || "",
            lastname: (config.lastname as string) || "",
            phone: (config.phone as string) || "",
            company: (config.company as string) || "",
            jobtitle: (config.jobtitle as string) || "",
            lifecyclestage: (config.lifecyclestage as string) || "lead",
          },
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "hubspot_create_contact" },
      };
    },
  },
});
