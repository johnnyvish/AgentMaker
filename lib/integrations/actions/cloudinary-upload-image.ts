import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const cloudinaryUploadImage: Integration = createIntegration({
  id: "cloudinary_upload_image",
  name: "Cloudinary Upload Image",
  category: "action",
  description: "Upload and transform images with Cloudinary",
  icon: "cloudinary",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "file",
        type: "textarea",
        label: "File (Base64 or URL)",
        placeholder: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        required: true,
        supportExpressions: true,
      },
      {
        key: "folder",
        type: "text",
        label: "Folder",
        placeholder: "my-app/uploads",
        required: false,
      },
      {
        key: "public_id",
        type: "text",
        label: "Public ID",
        placeholder: "my-image",
        required: false,
      },
      {
        key: "transformations",
        type: "textarea",
        label: "Transformations (JSON)",
        placeholder: '{"width": 800, "height": 600, "crop": "fill", "quality": "auto"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "tags",
        type: "text",
        label: "Tags (comma-separated)",
        placeholder: "profile, avatar, user",
        required: false,
      },
    ],
    required: ["file"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          publicId: config.public_id as string || "my-app/image_123",
          url: "https://res.cloudinary.com/demo/image/upload/v1234567890/my-app/image_123.jpg",
          secureUrl: "https://res.cloudinary.com/demo/image/upload/v1234567890/my-app/image_123.jpg",
          width: 800,
          height: 600,
          format: "jpg",
          resourceType: "image",
          bytes: 12345,
          folder: config.folder as string || "",
          tags: config.tags ? (config.tags as string).split(',').map(tag => tag.trim()) : [],
          transformations: config.transformations ? JSON.parse(config.transformations as string) : {},
          createdAt: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "cloudinary_upload_image" },
      };
    },
  },
}); 