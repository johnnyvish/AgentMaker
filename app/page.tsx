"use client";

import { useState, useEffect } from "react";
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

interface NodeData {
  subtype?: string;
  description?: string;
  label?: string;
}

interface Node {
  type: string;
  data?: NodeData;
}

interface Automation {
  id: string;
  name: string;
  nodes: Node[];
  edges: Record<string, unknown>[];
  status: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getTriggerIcon = (nodes: Node[]) => {
  // Find the first trigger node to determine the trigger type
  const triggerNode = nodes.find(
    (node) =>
      node.type === "trigger" ||
      (node.data?.subtype && node.data.subtype.includes("_trigger"))
  );

  if (!triggerNode) return <Zap className="w-4 h-4" />;

  const subtype = triggerNode.data?.subtype;
  switch (subtype) {
    case "webhook_trigger":
      return <Globe className="w-4 h-4" />;
    case "schedule_trigger":
      return <Clock className="w-4 h-4" />;
    case "email_trigger":
      return <Mail className="w-4 h-4" />;
    case "manual_trigger":
      return <User className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
};

const getAutomationDescription = (nodes: Node[]) => {
  if (nodes.length === 0) return "No nodes configured";

  const actionNodes = nodes.filter(
    (node) =>
      node.type === "action" ||
      (node.data?.subtype && !node.data.subtype.includes("_trigger"))
  );

  if (actionNodes.length === 0) return "No actions configured";

  const firstAction = actionNodes[0];
  return (
    firstAction.data?.description ||
    firstAction.data?.label ||
    "Action configured"
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Home() {
  const { theme, toggleTheme, mounted } = useThemeToggle();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "automations" | "integrations" | "settings" | "docs"
  >("automations");

  // Fetch automations on component mount
  useEffect(() => {
    const fetchAutomations = async () => {
      try {
        const response = await fetch("/api/automations");
        if (response.ok) {
          const data = await response.json();
          setAutomations(data);
        }
      } catch (error) {
        console.error("Failed to fetch automations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAutomations();
  }, []);

  // Sort automations by last updated
  const sortedAutomations = automations.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this automation?"))
      return;

    try {
      const response = await fetch(`/api/automations?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAutomations((prev) =>
          prev.filter((automation) => automation.id !== id)
        );
      }
    } catch (error) {
      console.error("Failed to delete automation:", error);
    }
  };

  const handleToggleAutomation = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const response = await fetch(`/api/automations?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setAutomations((prev) =>
          prev.map((automation) =>
            automation.id === id
              ? { ...automation, status: newStatus }
              : automation
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle automation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* TOP BAR */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-wide">
              {"[Agent Maker]"}
            </h1>
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

            {!loading && sortedAutomations.length > 0 && (
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Automation
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-[var(--border)]">
        <div className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("automations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "automations"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Automations
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "integrations"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "settings"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "docs"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Docs
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6">
        {activeTab === "automations" ? (
          <>
            {loading ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-[var(--muted-foreground)]">
                    Loading automations...
                  </p>
                </div>
              </div>
            ) : sortedAutomations.length === 0 ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center">
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
                        {getTriggerIcon(automation.nodes)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] text-lg mb-1 truncate">
                          {automation.name}
                        </h3>
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                          {getAutomationDescription(automation.nodes)}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] relative z-20">
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {new Date(automation.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAutomation(
                              automation.id,
                              automation.status
                            );
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 ${
                            automation.status === "active"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-[var(--muted)] hover:bg-[var(--border)]"
                          }`}
                          title={
                            automation.status === "active"
                              ? "Turn off automation"
                              : "Turn on automation"
                          }
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              automation.status === "active"
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>

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
          </>
        ) : activeTab === "integrations" ? (
          // Integrations tab content
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Integrations coming soon
              </h3>
              <p className="text-[var(--muted-foreground)]">
                Manage your third-party integrations and API connections here.
              </p>
            </div>
          </div>
        ) : activeTab === "settings" ? (
          // Settings tab content
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--muted-foreground)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Settings coming soon
              </h3>
              <p className="text-[var(--muted-foreground)]">
                Configure your account preferences and application settings
                here.
              </p>
            </div>
          </div>
        ) : (
          // Docs tab content
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--muted-foreground)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                Documentation coming soon
              </h3>
              <p className="text-[var(--muted-foreground)]">
                Access guides, tutorials, and API documentation here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
