import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const s3UploadFile: Integration = createIntegration({
  id: "s3_upload_file",
  name: "AWS S3 Upload File",
  category: "action",
  description: "Upload files to AWS S3 bucket",
  icon: "aws",
  version: "1.0.0",

  auth: {
    type: "api_key",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "bucket",
        type: "text",
        label: "Bucket Name",
        placeholder: "my-upload-bucket",
        required: true,
      },
      {
        key: "key",
        type: "text",
        label: "Object Key",
        placeholder: "uploads/file.txt",
        required: true,
        supportExpressions: true,
      },
      {
        key: "file_content",
        type: "textarea",
        label: "File Content",
        placeholder: "File content or base64 encoded data",
        required: true,
        supportExpressions: true,
      },
      {
        key: "content_type",
        type: "text",
        label: "Content Type",
        placeholder: "text/plain",
        required: false,
      },
      {
        key: "metadata",
        type: "textarea",
        label: "Metadata (JSON)",
        placeholder: '{"author": "John Doe", "version": "1.0"}',
        required: false,
        supportExpressions: true,
      },
      {
        key: "acl",
        type: "select",
        label: "Access Control",
        required: false,
        options: [
          { label: "Private", value: "private" },
          { label: "Public Read", value: "public-read" },
          { label: "Public Read Write", value: "public-read-write" },
          { label: "Authenticated Read", value: "authenticated-read" },
        ],
      },
    ],
    required: ["bucket", "key", "file_content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          bucket: config.bucket as string,
          key: config.key as string,
          etag: '"abc123def456ghi789"',
          versionId: "null",
          location: `https://${config.bucket}.s3.amazonaws.com/${config.key}`,
          contentType: config.content_type as string || "application/octet-stream",
          metadata: config.metadata ? JSON.parse(config.metadata as string) : {},
          acl: config.acl as string || "private",
          size: (config.file_content as string).length,
          lastModified: timestamp,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "s3_upload_file" },
      };
    },
  },
}); 