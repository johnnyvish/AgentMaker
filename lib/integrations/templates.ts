export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      subtype: string;
      icon: string;
      description: string;
      config?: Record<string, unknown>;
      colorClass?: string;
      borderClass?: string;
      selectedBorderClass?: string;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "manual-slack-notification",
    name: "Manual → Slack",
    description: "Manually trigger and send Slack notification",
    icon: "play",
    nodes: [
      {
        id: "manual-1",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: {
          label: "Manual Trigger",
          subtype: "manual_trigger",
          icon: "play",
          description: "Trigger workflow manually",
          colorClass: "text-amber-600 dark:text-amber-400",
          borderClass: "border-amber-200 dark:border-amber-800",
          selectedBorderClass: "border-amber-600 dark:border-amber-400",
        },
      },
      {
        id: "slack-1",
        type: "action",
        position: { x: 400, y: 100 },
        data: {
          label: "Send Slack Message",
          subtype: "slack_send_message",
          icon: "message-square",
          description: "Send a message to a Slack channel",
          config: {
            channel: "general",
            message:
              "Manual trigger activated! Workflow executed successfully.",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "manual-1",
        target: "slack-1",
      },
    ],
  },
  {
    id: "schedule-email-reminder",
    name: "Daily Email Reminder",
    description: "Send scheduled email reminders",
    icon: "calendar",
    nodes: [
      {
        id: "schedule-1",
        type: "trigger",
        position: { x: 100, y: 100 },
        data: {
          label: "Schedule",
          subtype: "schedule_trigger",
          icon: "clock",
          description: "Run on a schedule",
          config: {
            schedule: "0 9 * * *", // 9 AM daily
            timezone: "UTC",
          },
          colorClass: "text-amber-600 dark:text-amber-400",
          borderClass: "border-amber-200 dark:border-amber-800",
          selectedBorderClass: "border-amber-600 dark:border-amber-400",
        },
      },
      {
        id: "email-1",
        type: "action",
        position: { x: 400, y: 100 },
        data: {
          label: "Send Email",
          subtype: "email_send",
          icon: "mail",
          description: "Send an email message",
          config: {
            to: "team@company.com",
            subject: "Daily Reminder",
            body: "Don't forget to check your tasks for today!",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "schedule-1",
        target: "email-1",
      },
    ],
  },
  {
    id: "webhook-filter-slack",
    name: "Webhook → Filter → Slack",
    description: "Filter webhook data before sending to Slack",
    icon: "workflow",
    nodes: [
      {
        id: "webhook-1",
        type: "trigger",
        position: { x: 50, y: 100 },
        data: {
          label: "Webhook",
          subtype: "webhook_trigger",
          icon: "link",
          description: "Receive HTTP requests",
          colorClass: "text-amber-600 dark:text-amber-400",
          borderClass: "border-amber-200 dark:border-amber-800",
          selectedBorderClass: "border-amber-600 dark:border-amber-400",
        },
      },
      {
        id: "filter-1",
        type: "logic",
        position: { x: 300, y: 100 },
        data: {
          label: "Filter",
          subtype: "filter_condition",
          icon: "search",
          description: "Filter data conditionally",
          config: {
            field: "{{$node.webhook-1.data.body.status}}",
            operator: "equals",
            value: "active",
          },
          colorClass: "text-violet-600 dark:text-violet-400",
          borderClass: "border-violet-200 dark:border-violet-800",
          selectedBorderClass: "border-violet-600 dark:border-violet-400",
        },
      },
      {
        id: "slack-1",
        type: "action",
        position: { x: 550, y: 100 },
        data: {
          label: "Send Slack Message",
          subtype: "slack_send_message",
          icon: "message-square",
          description: "Send a message to a Slack channel",
          config: {
            channel: "alerts",
            message:
              "Active status detected: {{$node.webhook-1.data.body.message}}",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "webhook-1",
        target: "filter-1",
      },
      {
        id: "e2",
        source: "filter-1",
        target: "slack-1",
      },
    ],
  },
  {
    id: "complex-data-processing",
    name: "Data Processing Pipeline",
    description:
      "Manual trigger → Variable storage → Data transformation → AI processing → Conditional branching → Multiple notifications",
    icon: "workflow",
    nodes: [
      // Manual Trigger
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 50, y: 200 },
        data: {
          label: "Manual Trigger",
          subtype: "manual_trigger",
          icon: "hand",
          description: "Start the data processing pipeline",
          config: {
            triggerName: "Data Processing Pipeline",
          },
          colorClass: "text-amber-600 dark:text-amber-400",
          borderClass: "border-amber-200 dark:border-amber-800",
          selectedBorderClass: "border-amber-600 dark:border-amber-400",
        },
      },

      // Set Variable - Store initial data
      {
        id: "var-1",
        type: "action",
        position: { x: 300, y: 200 },
        data: {
          label: "Store User Data",
          subtype: "set_variable",
          icon: "database",
          description: "Store user information in variable",
          config: {
            variableName: "userData",
            value: {
              userId: 12345,
              name: "John Doe",
              email: "john.doe@example.com",
              department: "Engineering",
              priority: "high",
            },
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // API Request - Fetch additional data
      {
        id: "api-1",
        type: "action",
        position: { x: 550, y: 200 },
        data: {
          label: "Fetch User Profile",
          subtype: "api_request",
          icon: "globe",
          description: "Get detailed user profile from API",
          config: {
            url: "https://jsonplaceholder.typicode.com/users/1",
            method: "GET",
            headers: '{"Authorization": "Bearer token123"}',
            body: '{"user_id": "{{$vars.userData}}"}',
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // Transform Data - Process the API response
      {
        id: "transform-1",
        type: "logic",
        position: { x: 800, y: 200 },
        data: {
          label: "Process Profile Data",
          subtype: "transform_data",
          icon: "brain",
          description: "Transform and format user profile data",
          config: {
            inputData: "{{$node.api-1.data.response}}",
            transformation: "format_json",
            fieldPath: "email",
          },
          colorClass: "text-violet-600 dark:text-violet-400",
          borderClass: "border-violet-200 dark:border-violet-800",
          selectedBorderClass: "border-violet-600 dark:border-violet-400",
        },
      },

      // Set Variable - Store processed data
      {
        id: "var-2",
        type: "action",
        position: { x: 1050, y: 200 },
        data: {
          label: "Store Processed Data",
          subtype: "set_variable",
          icon: "database",
          description: "Save processed user profile",
          config: {
            variableName: "processedProfile",
            value: "{{$node.transform-1.data.result}}",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // AI Processing - Generate summary
      {
        id: "ai-1",
        type: "action",
        position: { x: 1300, y: 200 },
        data: {
          label: "Generate AI Summary",
          subtype: "ai",
          icon: "brain",
          description: "Create AI-generated user summary",
          config: {
            ai_mode: "llm",
            model: "gpt-4",
            prompt:
              "Create a professional summary for user: {{$vars.processedProfile}}. Focus on their role and key attributes.",
            max_tokens: 200,
            temperature: 0.7,
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // Branch Condition - Check priority level
      {
        id: "branch-1",
        type: "logic",
        position: { x: 1550, y: 200 },
        data: {
          label: "Check Priority",
          subtype: "branch_condition",
          icon: "diamond",
          description: "Branch based on user priority level",
          config: {
            condition: "{{$vars.userData.priority}} === 'high'",
            trueLabel: "High Priority Path",
            falseLabel: "Standard Priority Path",
          },
          colorClass: "text-violet-600 dark:text-violet-400",
          borderClass: "border-violet-200 dark:border-violet-800",
          selectedBorderClass: "border-violet-600 dark:border-violet-400",
        },
      },

      // High Priority Path - Immediate Slack notification
      {
        id: "slack-high",
        type: "action",
        position: { x: 1400, y: 50 },
        data: {
          label: "Urgent Slack Alert",
          subtype: "slack_send_message",
          icon: "message-square",
          description: "Send urgent notification to Slack",
          config: {
            channel: "urgent-alerts",
            message:
              "🚨 HIGH PRIORITY USER PROCESSED 🚨\n\nUser: {{$vars.userData.name}}\nDepartment: {{$vars.userData.department}}\n\nAI Summary:\n{{$node.ai-1.data.text}}\n\nProcessed at: {{$node.trigger-1.data.timestamp}}",
            username: "UrgentBot",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // Standard Priority Path - Regular email
      {
        id: "email-standard",
        type: "action",
        position: { x: 1700, y: 350 },
        data: {
          label: "Standard Email Report",
          subtype: "email_send",
          icon: "mail",
          description: "Send standard email report",
          config: {
            to: "admin@company.com",
            subject: "User Profile Processed - {{$vars.userData.name}}",
            body: "Hello Admin,\n\nA user profile has been processed:\n\nUser Details:\n- Name: {{$vars.userData.name}}\n- Email: {{$vars.userData.email}}\n- Department: {{$vars.userData.department}}\n\nAI Generated Summary:\n{{$node.ai-1.data.text}}\n\nProcessed Data:\n{{$vars.processedProfile}}\n\nBest regards,\nAutomation System",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // Delay before final notification
      {
        id: "delay-1",
        type: "action",
        position: { x: 1800, y: 200 },
        data: {
          label: "Wait 30 seconds",
          subtype: "delay",
          icon: "clock",
          description: "Brief delay before final notification",
          config: {
            amount: 30,
            unit: "seconds",
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },

      // Final API request - Log completion
      {
        id: "api-final",
        type: "action",
        position: { x: 2050, y: 200 },
        data: {
          label: "Log Completion",
          subtype: "api_request",
          icon: "globe",
          description: "Log pipeline completion to external system",
          config: {
            url: "https://api.example.com/logs",
            method: "POST",
            headers:
              '{"Content-Type": "application/json", "Authorization": "Bearer {{$vars.apiToken}}"}',
            body: JSON.stringify({
              event: "pipeline_completed",
              user_id: "{{$vars.userData.userId}}",
              user_name: "{{$vars.userData.name}}",
              priority: "{{$vars.userData.priority}}",
              ai_summary: "{{$node.ai-1.data.text}}",
              completion_time: "{{$node.delay-1.data.timestamp}}",
              notifications_sent: {
                slack: "{{$node.slack-high.data.messageId}}",
                email: "{{$node.email-standard.data.messageId}}",
              },
            }),
          },
          colorClass: "text-sky-600 dark:text-sky-400",
          borderClass: "border-sky-200 dark:border-sky-800",
          selectedBorderClass: "border-sky-600 dark:border-sky-400",
        },
      },
    ],
    edges: [
      // Main flow
      { id: "e1", source: "trigger-1", target: "var-1" },
      { id: "e2", source: "var-1", target: "api-1" },
      { id: "e3", source: "api-1", target: "transform-1" },
      { id: "e4", source: "transform-1", target: "var-2" },
      { id: "e5", source: "var-2", target: "ai-1" },
      { id: "e6", source: "ai-1", target: "branch-1" },

      // Branch paths (Note: In a real implementation, these would be conditional)
      { id: "e7", source: "branch-1", target: "slack-high" },
      { id: "e8", source: "branch-1", target: "email-standard" },

      // Convergence to delay (both paths lead here)
      { id: "e9", source: "slack-high", target: "delay-1" },
      { id: "e10", source: "email-standard", target: "delay-1" },

      // Final step
      { id: "e11", source: "delay-1", target: "api-final" },
    ],
  },
];
