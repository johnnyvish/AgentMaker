import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const linkedinCreatePost: Integration = createIntegration({
  id: "linkedin_create_post",
  name: "LinkedIn Create Post",
  category: "action",
  description: "Create posts on LinkedIn",
  icon: "linkedin",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "content",
        type: "textarea",
        label: "Post Content",
        placeholder: "Share your thoughts...",
        required: true,
        supportExpressions: true,
      },
      {
        key: "visibility",
        type: "select",
        label: "Visibility",
        required: false,
        options: [
          { label: "Public", value: "PUBLIC" },
          { label: "Connections", value: "CONNECTIONS" },
          { label: "Group", value: "GROUP" },
        ],
      },
      {
        key: "group_id",
        type: "text",
        label: "Group ID (if posting to group)",
        placeholder: "123456789",
        required: false,
      },
      {
        key: "media_urls",
        type: "textarea",
        label: "Media URLs (JSON array)",
        placeholder: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
        required: false,
        supportExpressions: true,
      },
      {
        key: "article_url",
        type: "url",
        label: "Article URL",
        placeholder: "https://example.com/article",
        required: false,
      },
    ],
    required: ["content"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          postId: "urn:li:activity:1234567890123456789",
          content: config.content as string,
          visibility: config.visibility as string || "PUBLIC",
          groupId: config.group_id as string || "",
          mediaUrls: config.media_urls ? JSON.parse(config.media_urls as string) : [],
          articleUrl: config.article_url as string || "",
          createdAt: timestamp,
          authorId: "urn:li:person:123456789",
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "linkedin_create_post" },
      };
    },
  },
}); 