import { createIntegration } from "../utils";
import type { Integration } from "../types";

export const twitterPostTweet: Integration = createIntegration({
  id: "twitter_post_tweet",
  name: "Twitter Post Tweet",
  category: "action",
  description: "Post tweets to Twitter/X",
  icon: "twitter",
  version: "1.0.0",

  auth: {
    type: "oauth2",
    required: true,
  },

  schema: {
    fields: [
      {
        key: "text",
        type: "textarea",
        label: "Tweet Text",
        placeholder: "What's happening?",
        required: true,
        supportExpressions: true,
      },
      {
        key: "reply_to",
        type: "text",
        label: "Reply To Tweet ID",
        placeholder: "1234567890123456789",
        required: false,
      },
      {
        key: "media_ids",
        type: "text",
        label: "Media IDs (comma-separated)",
        placeholder: "1234567890123456789, 9876543210987654321",
        required: false,
      },
      {
        key: "poll_options",
        type: "textarea",
        label: "Poll Options (JSON array)",
        placeholder: '["Option 1", "Option 2", "Option 3", "Option 4"]',
        required: false,
      },
      {
        key: "poll_duration_minutes",
        type: "number",
        label: "Poll Duration (minutes)",
        placeholder: "1440",
        required: false,
      },
    ],
    required: ["text"],
  },

  executor: {
    async execute(config) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const timestamp = new Date().toISOString();
      
      return {
        success: true,
        data: {
          tweetId: "1234567890123456789",
          text: config.text as string,
          replyTo: config.reply_to as string || "",
          mediaIds: config.media_ids ? (config.media_ids as string).split(',').map(id => id.trim()) : [],
          pollOptions: config.poll_options ? JSON.parse(config.poll_options as string) : [],
          pollDurationMinutes: config.poll_duration_minutes as number || 0,
          createdAt: timestamp,
          authorId: "9876543210987654321",
          retweetCount: 0,
          likeCount: 0,
          replyCount: 0,
          quoteCount: 0,
          timestamp,
        },
        metadata: { nodeType: "action", subtype: "twitter_post_tweet" },
      };
    },
  },
}); 