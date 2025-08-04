import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const driveUploadFile: Integration = createIntegration({
  id: "drive_upload_file",
  name: "Google Drive Upload File",
  category: "action",
  description: "Upload files to Google Drive",
  icon: "google",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "filename",
        type: "text",
        label: "Filename",
        placeholder: "document.txt",
        required: true,
        supportExpressions: true,
      },
      {
        key: "content",
        type: "textarea",
        label: "File Content",
        placeholder: "File content or base64 encoded data",
        required: true,
        supportExpressions: true,
      },
      {
        key: "mime_type",
        type: "text",
        label: "MIME Type",
        placeholder: "text/plain",
        required: false,
      },
      {
        key: "parent_folder_id",
        type: "text",
        label: "Parent Folder ID",
        placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        required: false,
      },
      {
        key: "description",
        type: "textarea",
        label: "Description",
        placeholder: "File description",
        required: false,
      },
      {
        key: "permissions",
        type: "select",
        label: "Permissions",
        required: false,
        options: [
          { label: "Private", value: "private" },
          { label: "Anyone with link can view", value: "anyoneWithLink" },
          { label: "Anyone with link can edit", value: "anyoneWithLinkEdit" },
          { label: "Public", value: "public" },
        ],
      },
    ],
    required: ["filename", "content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const timestamp = new Date().toISOString();

      return {
        success: true,
        data: {
          fileId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
          filename: config.filename as string,
          mimeType: (config.mime_type as string) || "text/plain",
          parentFolderId: (config.parent_folder_id as string) || "",
          description: (config.description as string) || "",
          permissions: (config.permissions as string) || "private",
          size: (config.content as string).length,
          createdTime: timestamp,
          modifiedTime: timestamp,
          webViewLink: `https://drive.google.com/file/d/${
            config.file_id || "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
          }/view`,
          webContentLink: `https://drive.google.com/uc?id=${
            config.file_id || "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
          }`,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "drive_upload_file" },
      };
    },
  },
});
