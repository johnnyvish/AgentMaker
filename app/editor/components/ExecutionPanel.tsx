"use client";

import { Loader2 } from "lucide-react";
import { getIcon } from "../../../hooks/useIcons";
import { useAutomationContext } from "../context/AutomationContext";

const ExecutionPanel = () => {
  const { executionState, setShowExecutionPanel } = useAutomationContext();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Execution Details
        </h2>
        <button
          onClick={() => setShowExecutionPanel(false)}
          className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          {getIcon("x", "w-4 h-4")}
        </button>
      </div>

      <div
        className={`px-2 py-1 rounded text-xs font-medium mb-4 ${
          executionState.status === "running"
            ? "bg-blue-100 text-blue-800"
            : executionState.status === "completed"
            ? "bg-green-100 text-green-800"
            : executionState.status === "failed"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {executionState.status}
      </div>

      {/* Variables */}
      <div>
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
          Variables
        </h3>
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 text-xs">
          <pre className="whitespace-pre-wrap text-[var(--muted-foreground)]">
            {Object.keys(executionState.context.variables).length > 0
              ? JSON.stringify(executionState.context.variables, null, 2)
              : "No variables set"}
          </pre>
        </div>
      </div>

      {/* Node Outputs */}
      <div>
        <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
          Node Outputs
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.keys(executionState.context.nodeOutputs).length === 0 ? (
            <div className="text-xs text-[var(--muted-foreground)] italic">
              No node outputs yet. Run the workflow to see results.
            </div>
          ) : (
            Object.entries(executionState.context.nodeOutputs).map(
              ([nodeId, output]) => (
                <div
                  key={nodeId}
                  className="bg-[var(--muted)]/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-[var(--foreground)]">
                      {nodeId}
                    </span>
                    {executionState.currentNode === nodeId && (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    )}
                  </div>
                  <pre className="text-xs text-[var(--muted-foreground)] whitespace-pre-wrap">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;
