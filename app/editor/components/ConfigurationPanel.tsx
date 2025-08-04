"use client";

import { getIcon } from "../../../hooks/useIcons";
import { Copy as CopyIcon } from "lucide-react";
import { useAutomationContext } from "../context/AutomationContext";
import type { SchemaField } from "../../../lib/integrations/types";

interface NodeData {
  label: string;
  subtype?: string;
  icon?: string;
  description?: string;
  config?: Record<string, unknown>;
  status?: "idle" | "running" | "success" | "error";
  lastRun?: string;
  executionResult?: Record<string, unknown>;
  colorClass?: string;
  borderClass?: string;
  selectedBorderClass?: string;
}

const ConfigurationPanel = () => {
  const {
    selectedNode,
    executionState,
    copiedField,
    deleteSelectedNode,
    updateNodeConfig,
    getIntegration,
    copyExpression,
    copyDataFieldExpressionWithFeedback,
  } = useAutomationContext();

  if (!selectedNode) {
    return null;
  }

  const nodeData = selectedNode.data as unknown as NodeData;
  const integrationId = nodeData.subtype;
  const integration = getIntegration(integrationId || "");

  if (!integration) {
    return (
      <div className="text-red-500 text-sm">
        Integration not found: {integrationId}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--muted)] rounded-lg">
            {getIcon(
              nodeData.icon || "circle",
              "w-5 h-5",
              "text-[var(--muted-foreground)]"
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {nodeData.label}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] capitalize">
              {selectedNode.type} step
            </p>
          </div>
        </div>
        <button
          onClick={deleteSelectedNode}
          className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          {getIcon("trash", "w-4 h-4")}
        </button>
      </div>

      {/* Output Section */}
      {nodeData.executionResult && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Output
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(
              (nodeData.executionResult?.data as Record<string, unknown>) || {}
            ).map((fieldKey) => (
              <button
                key={fieldKey}
                onClick={() =>
                  copyDataFieldExpressionWithFeedback(selectedNode.id, fieldKey)
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer shadow-sm ${
                  copiedField === fieldKey
                    ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                    : "text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--ring)]"
                }`}
                title={
                  copiedField === fieldKey
                    ? "Copied!"
                    : "Click to copy reference"
                }
              >
                {copiedField === fieldKey ? (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <CopyIcon className="w-3 h-3 text-[var(--muted-foreground)]" />
                )}
                {fieldKey}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-4">
          {integration.schema.fields.map((field: SchemaField) => (
            <div key={field.key} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] select-none">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
              </div>

              {field.type === "select" ? (
                <select
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]/10 transition-all bg-[var(--muted)]/50"
                  value={(nodeData.config?.[field.key] as string) || ""}
                  onChange={(e) => {
                    const currentConfig = nodeData.config || {};
                    updateNodeConfig(selectedNode.id, {
                      ...currentConfig,
                      [field.key]: e.target.value,
                    });
                  }}
                >
                  <option value="">Select {field.label}</option>
                  {Array.isArray(field.options) &&
                    field.options.map(
                      (option: { label: string; value: string }) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      )
                    )}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]/10 transition-all bg-[var(--muted)]/50 resize-none"
                  rows={3}
                  placeholder={field.placeholder}
                  value={(nodeData.config?.[field.key] as string) || ""}
                  onChange={(e) => {
                    const currentConfig = nodeData.config || {};
                    updateNodeConfig(selectedNode.id, {
                      ...currentConfig,
                      [field.key]: e.target.value,
                    });
                  }}
                />
              ) : (
                <input
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "email"
                      ? "email"
                      : field.type === "url"
                      ? "url"
                      : "text"
                  }
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]/10 transition-all bg-[var(--muted)]/50"
                  placeholder={field.placeholder}
                  value={(nodeData.config?.[field.key] as string) || ""}
                  onChange={(e) => {
                    const currentConfig = nodeData.config || {};
                    updateNodeConfig(selectedNode.id, {
                      ...currentConfig,
                      [field.key]: e.target.value,
                    });
                  }}
                />
              )}

              {field.supportExpressions && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Use {"{{$node.NodeId.data.field}}"} to reference previous
                  nodes or {"{{$vars.variableName}}"} for variables
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Branch Outputs Section */}
        {nodeData.subtype === "branch_condition" && (
          <div className="mt-6 p-4 bg-[var(--muted)]/50 rounded-lg">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
              Branch Outputs
            </h4>
            <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <div>
                ✅ True path: Connects to nodes that execute when condition is
                true
              </div>
              <div>
                ❌ False path: Connects to nodes that execute when condition is
                false
              </div>
            </div>
          </div>
        )}

        {/* Available Data Section */}
        <div className="space-y-4 border-t border-[var(--border)] pt-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Available Data
          </h3>

          {/* Previous Node Outputs */}
          {Object.keys(executionState.context.nodeOutputs).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                From Previous Nodes:
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(executionState.context.nodeOutputs).map(
                  ([nodeId, output]) => (
                    <div
                      key={nodeId}
                      className="bg-[var(--muted)]/50 rounded p-2"
                    >
                      <button
                        onClick={() =>
                          copyExpression(`{{$node.${nodeId}.data.FIELD}}`)
                        }
                        className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--primary)] cursor-pointer mb-1 block w-full text-left"
                        title="Click to copy"
                      >
                        {`{{$node.${nodeId}.data.FIELD}}`}
                      </button>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Available fields:{" "}
                        {Object.keys(
                          ((output as Record<string, unknown>)?.data as Record<
                            string,
                            unknown
                          >) || {}
                        ).join(", ") || "none"}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Variables */}
          {Object.keys(executionState.context.variables).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Variables:
              </h4>
              <div className="bg-[var(--muted)]/50 rounded p-2">
                {Object.keys(executionState.context.variables).map(
                  (varName) => (
                    <button
                      key={varName}
                      onClick={() => copyExpression(`{{$vars.${varName}}}`)}
                      className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--primary)] cursor-pointer block w-full text-left"
                      title="Click to copy"
                    >
                      {`{{$vars.${varName}}}`}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Helpful hint when nothing is available */}
          {Object.keys(executionState.context.nodeOutputs).length === 0 &&
            Object.keys(executionState.context.variables).length === 0 && (
              <div className="text-xs text-[var(--muted-foreground)] italic">
                Run previous nodes to see available data
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default ConfigurationPanel;
