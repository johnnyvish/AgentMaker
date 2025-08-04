import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const paypalSendPayment: Integration = createIntegration({
  id: "paypal_send_payment",
  name: "PayPal Send Payment",
  category: "action",
  description: "Send payments via PayPal",
  icon: "paypal",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "recipient_email",
        type: "email",
        label: "Recipient Email",
        placeholder: "recipient@example.com",
        required: true,
      },
      {
        key: "amount",
        type: "number",
        label: "Amount",
        placeholder: "25.00",
        required: true,
      },
      {
        key: "currency",
        type: "select",
        label: "Currency",
        required: true,
        options: [
          { label: "USD", value: "USD" },
          { label: "EUR", value: "EUR" },
          { label: "GBP", value: "GBP" },
          { label: "CAD", value: "CAD" },
          { label: "AUD", value: "AUD" },
        ],
      },
      {
        key: "note",
        type: "textarea",
        label: "Note",
        placeholder: "Payment for services rendered",
        required: false,
        supportExpressions: true,
      },
      {
        key: "subject",
        type: "text",
        label: "Subject",
        placeholder: "Payment from WorkflowBot",
        required: false,
      },
    ],
    required: ["recipient_email", "amount", "currency"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          paymentId: "PAY-1234567890ABCDEF",
          recipientEmail: config.recipient_email as string,
          amount: config.amount as number,
          currency: config.currency as string,
          status: "COMPLETED",
          note: (config.note as string) || "",
          subject: (config.subject as string) || "Payment from WorkflowBot",
          timestamp,
          fee: (config.amount as number) * 0.029 + 0.3,
          netAmount:
            (config.amount as number) -
            ((config.amount as number) * 0.029 + 0.3),
        },
        metadata: { nodeType: "action", subtype: "paypal_send_payment" },
      };
    },
  },
});
