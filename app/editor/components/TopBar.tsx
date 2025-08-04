"use client";

import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getIcon } from "../../../hooks/useIcons";
import { useAutomationContext } from "../context/AutomationContext";
import { useThemeToggle } from "../../../hooks/useThemeToggle";
import { useState } from "react";
import { Node } from "@xyflow/react";

const TopBar = () => {
  const {
    workflowName,
    isEditingTitle,
    nodes,
    edges,
    isExecuting,
    isSaving,
    lastSaveError,
    showExecutionPanel,
    setWorkflowName,
    setNodes,
    setShowExecutionPanel,
    handleTitleEdit,
    handleTitleSave,
    handleTitleKeyDown,
    executeWorkflow,
    saveWorkflow,
  } = useAutomationContext();

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const { theme, toggleTheme, mounted } = useThemeToggle();

  const handleExecuteWorkflow = async () => {
    const onNodeStatusChange = (
      nodeId: string,
      status: "idle" | "running" | "success" | "error",
      lastRun?: string,
      executionResult?: Record<string, unknown>
    ) => {
      // Update the node status in the nodes array
      setNodes((prevNodes: Node[]) =>
        prevNodes.map((node: Node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  status,
                  lastRun,
                  executionResult,
                },
              }
            : node
        )
      );
    };

    setShowExecutionPanel(true);
    await executeWorkflow(nodes, edges, onNodeStatusChange);
  };

  const handleManualSave = async () => {
    try {
      await saveWorkflow(nodes, edges, workflowName);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000); // Hide after 2 seconds
    } catch (error) {
      console.error("Manual save failed:", error);
    }
  };

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Home Button */}
          <Link
            href="/"
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            aria-label="Go to home"
          >
            {getIcon("dashboard", "w-6 h-6", "text-[var(--foreground)]")}
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-lg sm:text-xl font-semibold text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-md shadow-sm focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] focus:outline-none px-2 sm:px-3 py-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg sm:text-xl font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--muted-foreground)] transition-colors px-1 py-0.5 rounded"
                onClick={handleTitleEdit}
                title="Click to edit title"
              >
                {workflowName}
              </h1>
            )}

            {/* Auto-save status indicator */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isSaving && (
                <div className="flex items-center gap-1 text-xs sm:text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </div>
              )}
              {lastSaveError && (
                <div
                  className="flex items-center gap-1 text-xs sm:text-sm text-red-600 dark:text-red-400"
                  title={lastSaveError}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Save failed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          <button
            onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            className="p-2 text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="View execution details"
          >
            {getIcon("activity", "w-4 h-4")}
          </button>

          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-w-[60px] sm:min-w-[80px] ${
              isSaving
                ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                : showSaveSuccess
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-not-allowed"
                : "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80"
            }`}
            title="Save workflow"
            aria-label="Save workflow"
          >
            {isSaving ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </div>
            ) : showSaveSuccess ? (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Saved!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {getIcon("save", "w-4 h-4", "sm:mr-2")}
                <span className="hidden sm:inline">Save</span>
              </div>
            )}
          </button>
          <button
            onClick={handleExecuteWorkflow}
            disabled={isExecuting}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              isExecuting
                ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
            }`}
          >
            {isExecuting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Running...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {getIcon("play", "w-4 h-4", "sm:mr-2")}
                <span className="hidden sm:inline">Run</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
