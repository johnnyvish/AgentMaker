import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const stripeCreatePayment: Integration = createIntegration({
  id: "stripe_create_payment",
  name: "Stripe Create Payment",
  category: "action",
  description: "Process payments with Stripe",
  icon: "stripe",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "amount",
        type: "number",
        label: "Amount (in cents)",
        placeholder: "2000",
        required: true,
      },
      {
        key: "currency",
        type: "select",
        label: "Currency",
        required: true,
        options: [
          { label: "USD", value: "usd" },
          { label: "EUR", value: "eur" },
          { label: "GBP", value: "gbp" },
          { label: "CAD", value: "cad" },
          { label: "AUD", value: "aud" },
        ],
      },
      {
        key: "payment_method",
        type: "text",
        label: "Payment Method ID",
        placeholder: "pm_1234567890abcdef",
        required: true,
      },
      {
        key: "customer_id",
        type: "text",
        label: "Customer ID",
        placeholder: "cus_1234567890abcdef",
        required: false,
      },
      {
        key: "description",
        type: "text",
        label: "Description",
        placeholder: "Payment for services",
        required: false,
        supportExpressions: true,
      },
      {
        key: "metadata",
        type: "textarea",
        label: "Metadata (JSON)",
        placeholder: '{"order_id": "12345", "user_id": "67890"}',
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["amount", "currency", "payment_method"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          paymentIntentId: "pi_1234567890abcdef",
          amount: config.amount as number,
          currency: config.currency as string,
          status: "succeeded",
          customerId: config.customer_id as string || "cus_1234567890abcdef",
          description: config.description as string || "Payment for services",
          metadata: config.metadata ? JSON.parse(config.metadata as string) : {},
          created: Math.floor(Date.now() / 1000),
          timestamp,
          receiptUrl: "https://receipt.stripe.com/1234567890",
        },
        metadata: { nodeType: "action", subtype: "stripe_create_payment" },
      };
    },
  },
}); 