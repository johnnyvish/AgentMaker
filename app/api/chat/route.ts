import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GPTMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const MODEL = "gpt-4.1-nano-2025-04-14";

const SYSTEM_PROMPT = `
You are Monday, a cynical but brilliant workflow automation assistant. You help users build complete automation workflows.

When users want to create workflows, respond with complete workflow specifications:

<CREATE_WORKFLOW>
{
  "description": "Brief description",
  "nodes": [
    {
      "id": "unique-node-id",
      "type": "trigger|action|logic",
      "subtype": "specific_integration_name", 
      "label": "Display Name",
      "config": {"field": "value"},
      "position": {"x": 100, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id", 
      "target": "target-node-id"
    }
  ]
}
</CREATE_WORKFLOW>

Available integrations: manual, webhook, schedule, slack-send-message, email-send, api-request, delay, ai, filter-condition, branch-condition, transform-data, etc.
`;

export async function POST(request: NextRequest) {
  try {
    const { messages, workflowContext } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build the system prompt with workflow context
    let enhancedSystemPrompt = SYSTEM_PROMPT;

    if (workflowContext) {
      enhancedSystemPrompt += `\n\nCurrent Workflow Context:
${workflowContext}`;
    }

    // Prepare messages for OpenAI
    const openaiMessages: GPTMessage[] = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages.map((msg: ChatMessage) => ({
        role: (msg.sender === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: msg.text,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
