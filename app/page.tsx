"use client";
import { useState } from "react";
import Link from "next/link";
import { useThemeToggle } from "../hooks/useThemeToggle";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Zap,
  User,
  Mail,
  Globe,
} from "lucide-react";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Automation {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "error";
  triggerType: "manual" | "webhook" | "schedule" | "email";
  lastRun?: string;
  updatedAt: string;
}

// ============================================
// MOCK DATA
// ============================================

const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Customer Welcome Email",
    description: "Send welcome email when new customer signs up",
    status: "active",
    triggerType: "webhook",
    lastRun: "2 hours ago",
    updatedAt: "2024-07-30",
  },
  {
    id: "2",
    name: "Weekly Sales Report",
    description: "Generate and send weekly sales report to team",
    status: "active",
    triggerType: "schedule",
    lastRun: "3 days ago",
    updatedAt: "2024-07-28",
  },
  {
    id: "3",
    name: "Support Ticket Routing",
    description: "Automatically route support tickets to appropriate team",
    status: "error",
    triggerType: "email",
    lastRun: "1 day ago",
    updatedAt: "2024-08-01",
  },
  {
    id: "4",
    name: "Slack Daily Standup",
    description: "Send daily standup reminder to development team",
    status: "active",
    triggerType: "schedule",
    lastRun: "8 hours ago",
    updatedAt: "2024-07-29",
  },
  {
    id: "5",
    name: "Invoice Processing",
    description: "Process incoming invoices and update accounting system",
    status: "inactive",
    triggerType: "email",
    lastRun: "1 week ago",
    updatedAt: "2024-07-25",
  },
  {
    id: "6",
    name: "Lead Qualification",
    description: "Score and qualify new leads from website forms",
    status: "active",
    triggerType: "webhook",
    lastRun: "30 minutes ago",
    updatedAt: "2024-08-01",
  },
];

// ============================================
// MOCK API FUNCTIONS
// ============================================

const mockAPI = {
  getAutomations: () => {
    return Promise.resolve(mockAutomations);
  },

  toggleAutomation: (id: string) => {
    console.log("Toggling automation:", id);
    return Promise.resolve({ success: true });
  },

  deleteAutomation: (id: string) => {
    console.log("Deleting automation:", id);
    return Promise.resolve({ success: true });
  },

  runAutomation: (id: string) => {
    console.log("Running automation:", id);
    return Promise.resolve({
      success: true,
      executionId: Date.now().toString(),
    });
  },

  duplicateAutomation: (id: string) => {
    console.log("Duplicating automation:", id);
    return Promise.resolve({ success: true, newId: Date.now().toString() });
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getTriggerIcon = (triggerType: string) => {
  switch (triggerType) {
    case "webhook":
      return <Globe className="w-4 h-4" />;
    case "schedule":
      return <Clock className="w-4 h-4" />;
    case "email":
      return <Mail className="w-4 h-4" />;
    case "manual":
      return <User className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Home() {
  const { theme, toggleTheme, mounted } = useThemeToggle();
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);

  // Sort automations by last updated
  const sortedAutomations = automations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this automation?"))
      return;

    try {
      await mockAPI.deleteAutomation(id);
      setAutomations((prev) =>
        prev.filter((automation) => automation.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete automation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* TOP BAR */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Empty space for layout consistency */}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            )}

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </Link>
          </div>
        </div>
      </div>

      {/* AUTOMATION GRID */}
      <div className="p-6">
        {sortedAutomations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              No automations yet
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6">
              Create your first automation to get started
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Automation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAutomations.map((automation) => (
              <div
                key={automation.id}
                className="group relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 hover:shadow-lg hover:border-[var(--ring)] transition-all duration-200 cursor-pointer"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      automation.status === "active"
                        ? "bg-green-500"
                        : automation.status === "error"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-[var(--muted)] rounded-lg flex-shrink-0">
                    {getTriggerIcon(automation.triggerType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] text-lg mb-1 truncate">
                      {automation.name}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                      {automation.description}
                    </p>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {automation.lastRun}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor?id=${automation.id}`}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAutomation(automation.id);
                      }}
                      className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Click Overlay */}
                <Link
                  href={`/editor?id=${automation.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={`View ${automation.name} details`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
