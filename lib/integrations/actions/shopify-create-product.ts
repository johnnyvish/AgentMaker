import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const shopifyCreateProduct: Integration = createIntegration({
  id: "shopify_create_product",
  name: "Shopify Create Product",
  category: "action",
  description: "Create products, update inventory, process orders",
  icon: "shopify",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "title",
        type: "text",
        label: "Product Title",
        placeholder: "Premium Wireless Headphones",
        required: true,
        supportExpressions: true,
      },
      {
        key: "description",
        type: "textarea",
        label: "Product Description",
        placeholder: "High-quality wireless headphones with noise cancellation...",
        required: false,
        supportExpressions: true,
      },
      {
        key: "product_type",
        type: "text",
        label: "Product Type",
        placeholder: "Electronics",
        required: false,
        supportExpressions: true,
      },
      {
        key: "vendor",
        type: "text",
        label: "Vendor",
        placeholder: "TechCorp",
        required: false,
        supportExpressions: true,
      },
      {
        key: "tags",
        type: "text",
        label: "Tags (comma-separated)",
        placeholder: "wireless, bluetooth, audio",
        required: false,
        supportExpressions: true,
      },
      {
        key: "price",
        type: "number",
        label: "Price",
        placeholder: "99.99",
        required: true,
        supportExpressions: true,
      },
      {
        key: "compare_at_price",
        type: "number",
        label: "Compare at Price",
        placeholder: "129.99",
        required: false,
        supportExpressions: true,
      },
      {
        key: "cost_per_item",
        type: "number",
        label: "Cost per Item",
        placeholder: "45.00",
        required: false,
        supportExpressions: true,
      },
      {
        key: "sku",
        type: "text",
        label: "SKU",
        placeholder: "WH-001",
        required: false,
        supportExpressions: true,
      },
      {
        key: "barcode",
        type: "text",
        label: "Barcode",
        placeholder: "1234567890123",
        required: false,
        supportExpressions: true,
      },
      {
        key: "weight",
        type: "number",
        label: "Weight (grams)",
        placeholder: "250",
        required: false,
        supportExpressions: true,
      },
      {
        key: "weight_unit",
        type: "select",
        label: "Weight Unit",
        required: false,
        options: [
          { label: "Grams", value: "g" },
          { label: "Kilograms", value: "kg" },
          { label: "Ounces", value: "oz" },
          { label: "Pounds", value: "lb" },
        ],
      },
      {
        key: "inventory_quantity",
        type: "number",
        label: "Inventory Quantity",
        placeholder: "100",
        required: false,
        supportExpressions: true,
      },
      {
        key: "inventory_policy",
        type: "select",
        label: "Inventory Policy",
        required: false,
        options: [
          { label: "Deny", value: "deny" },
          { label: "Continue", value: "continue" },
        ],
      },
      {
        key: "images",
        type: "textarea",
        label: "Images (JSON array)",
        placeholder: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        required: false,
        options: [
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
          { label: "Archived", value: "archived" },
        ],
      },
      {
        key: "published_at",
        type: "text",
        label: "Published At",
        placeholder: "2024-12-01T10:00:00Z",
        required: false,
        supportExpressions: true,
      },
    ],
    required: ["title", "price"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();
      
      const title = config.title as string;
      const description = config.description as string || "";
      const productType = config.product_type as string || "";
      const vendor = config.vendor as string || "";
      const tags = config.tags as string || "";
      const price = config.price as number;
      const compareAtPrice = config.compare_at_price as number;
      const costPerItem = config.cost_per_item as number;
      const sku = config.sku as string || "";
      const barcode = config.barcode as string || "";
      const weight = config.weight as number;
      const weightUnit = (config.weight_unit as string) || "g";
      const inventoryQuantity = (config.inventory_quantity as number) || 0;
      const inventoryPolicy = (config.inventory_policy as string) || "deny";
      const status = (config.status as string) || "active";
      const publishedAt = config.published_at as string || timestamp;

      let images: string[] = [];
      if (config.images) {
        try {
          images = JSON.parse(config.images as string);
        } catch {
          images = [];
        }
      }

      const productId = Math.floor(Math.random() * 1000000) + 1;
      const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      return {
        success: true,
        data: {
          productId,
          title,
          description,
          handle,
          productType,
          vendor,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          price,
          compareAtPrice: compareAtPrice || null,
          costPerItem: costPerItem || null,
          sku: sku || null,
          barcode: barcode || null,
          weight: weight || null,
          weightUnit,
          inventoryQuantity,
          inventoryPolicy,
          images,
          status,
          publishedAt,
          createdAt: timestamp,
          updatedAt: timestamp,
          adminGraphqlApiId: `gid://shopify/Product/${productId}`,
          variants: [{
            id: productId * 2,
            title: "Default Title",
            price,
            sku: sku || null,
            inventoryQuantity,
            inventoryPolicy,
            weight: weight || 0,
            weightUnit,
            requiresShipping: true,
            taxable: true,
            barcode: barcode || null,
            adminGraphqlApiId: `gid://shopify/ProductVariant/${productId * 2}`,
          }],
          options: [{
            id: 1,
            productId,
            name: "Title",
            position: 1,
            values: ["Default Title"],
          }],
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "shopify_create_product" },
      };
    },

    validate(config) {
      const errors: Record<string, string> = {};

      if (!config.title) {
        errors.title = "Product title is required";
      }

      if (!config.price) {
        errors.price = "Price is required";
      } else if (typeof config.price !== "number" || config.price < 0) {
        errors.price = "Price must be a positive number";
      }

      if (config.compare_at_price && (typeof config.compare_at_price !== "number" || config.compare_at_price < 0)) {
        errors.compare_at_price = "Compare at price must be a positive number";
      }

      if (config.cost_per_item && (typeof config.cost_per_item !== "number" || config.cost_per_item < 0)) {
        errors.cost_per_item = "Cost per item must be a positive number";
      }

      if (config.inventory_quantity && (typeof config.inventory_quantity !== "number" || config.inventory_quantity < 0)) {
        errors.inventory_quantity = "Inventory quantity must be a non-negative number";
      }

      if (config.weight && (typeof config.weight !== "number" || config.weight < 0)) {
        errors.weight = "Weight must be a positive number";
      }

      if (config.images) {
        try {
          JSON.parse(config.images as string);
        } catch {
          errors.images = "Images must be a valid JSON array";
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
  },
}); 