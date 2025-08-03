"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Skull,
  Copy,
  Check,
  RefreshCw,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Trash2,
} from "lucide-react";

interface LogEntry {
  id: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  context: string;
  metadata?: Record<string, unknown>;
  stack_trace?: string;
  user_id?: string;
  workflow_id?: string;
  execution_id?: string;
  node_id?: string;
  integration_id?: string;
  request_id?: string;
  timestamp: string;
}

interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  byContext: Record<string, number>;
  last24Hours: number;
}

interface LogsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
  executionId?: string;
}

export default function LogsPanel({
  isOpen,
  onClose,
  workflowId,
  executionId,
}: LogsPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: "",
    context: "",
    search: "",
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add context filters for current workflow/execution
      if (workflowId) params.append("workflowId", workflowId);
      if (executionId) params.append("executionId", executionId);
      params.append("limit", "200"); // Show more logs in the panel

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, workflowId, executionId]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      fetchStats();
      // Auto-refresh every 10 seconds when panel is open
      const interval = setInterval(fetchLogs, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchLogs]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/logs/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const copyLogEntry = (log: LogEntry) => {
    const logText = `[${log.timestamp}] ${log.level.toUpperCase()} [${
      log.context
    }] ${log.message}
${log.metadata ? `Metadata: ${JSON.stringify(log.metadata, null, 2)}` : ""}
${log.stack_trace ? `Stack Trace: ${log.stack_trace}` : ""}
${log.workflow_id ? `Workflow ID: ${log.workflow_id}` : ""}
${log.execution_id ? `Execution ID: ${log.execution_id}` : ""}
${log.node_id ? `Node ID: ${log.node_id}` : ""}`;

    copyToClipboard(logText);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const copyAllLogs = () => {
    if (filteredLogs.length === 0) return;

    const allLogsText = filteredLogs
      .map((log) => {
        return `[${log.timestamp}] ${log.level.toUpperCase()} [${
          log.context
        }] ${log.message}
${log.metadata ? `Metadata: ${JSON.stringify(log.metadata, null, 2)}` : ""}
${log.stack_trace ? `Stack Trace: ${log.stack_trace}` : ""}
${log.workflow_id ? `Workflow ID: ${log.workflow_id}` : ""}
${log.execution_id ? `Execution ID: ${log.execution_id}` : ""}
${log.node_id ? `Node ID: ${log.node_id}` : ""}`;
      })
      .join("\n\n");

    copyToClipboard(allLogsText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const exportLogs = () => {
    const logData = logs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      context: log.context,
      message: log.message,
      metadata: log.metadata,
      workflow_id: log.workflow_id,
      execution_id: log.execution_id,
      node_id: log.node_id,
      stack_trace: log.stack_trace,
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all logs? This action cannot be undone."
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch("/api/logs/clear", { method: "DELETE" });
      if (response.ok) {
        setLogs([]);
        setStats(null);
        fetchStats();
      } else {
        console.error("Failed to clear logs");
      }
    } catch (error) {
      console.error("Failed to clear logs:", error);
    } finally {
      setClearing(false);
    }
  };

  const getLogIcon = (level: string) => {
    const iconClass = "w-4 h-4";
    switch (level) {
      case "debug":
        return <Search className={`${iconClass} text-gray-500`} />;
      case "info":
        return <Info className={`${iconClass} text-blue-500`} />;
      case "warn":
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case "error":
        return <XCircle className={`${iconClass} text-red-500`} />;
      case "fatal":
        return <Skull className={`${iconClass} text-purple-500`} />;
      default:
        return <AlertCircle className={`${iconClass} text-gray-500`} />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "debug":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "warn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "fatal":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = logs.filter((log) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        log.context.toLowerCase().includes(searchLower) ||
        (log.workflow_id && log.workflow_id.includes(searchLower)) ||
        (log.execution_id && log.execution_id.includes(searchLower))
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[600px] bg-[var(--card)] border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              System Logs
            </h2>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <span>{stats.total} total</span>
                {stats.last24Hours > 0 && (
                  <span className="text-blue-500">
                    ({stats.last24Hours} today)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={copyAllLogs}
              disabled={filteredLogs.length === 0}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy all logs"
            >
              {copiedAll ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={exportLogs}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearAllLogs}
              disabled={clearing || logs.length === 0}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, level: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ring)] bg-[var(--background)]"
                >
                  <option value="">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>
                <select
                  value={filters.context}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, context: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ring)] bg-[var(--background)]"
                >
                  <option value="">All Contexts</option>
                  <option value="workflow">Workflow</option>
                  <option value="execution">Execution</option>
                  <option value="integration">Integration</option>
                  <option value="api">API</option>
                  <option value="system">System</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ring)] bg-[var(--background)]"
              />
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {stats && (
          <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex gap-4 text-xs">
              {Object.entries(stats.byLevel).map(([level, count]) => (
                <div key={level} className="flex items-center gap-1">
                  {getLogIcon(level)}
                  <span className="capitalize">
                    {level}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">
              No logs found
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                return (
                  <div
                    key={log.id}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--ring)]/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleLogExpansion(log.id)}
                        className="mt-0.5 p-0.5 rounded hover:bg-[var(--muted)] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)]" />
                        )}
                      </button>

                      <div className="mt-0.5">{getLogIcon(log.level)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLogLevelColor(
                              log.level
                            )}`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                            {log.context}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                          {log.message}
                        </p>

                        {(log.workflow_id ||
                          log.execution_id ||
                          log.node_id) && (
                          <div className="flex gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
                            {log.workflow_id && (
                              <span className="bg-[var(--muted)] px-2 py-0.5 rounded">
                                Workflow: {log.workflow_id.slice(-8)}
                              </span>
                            )}
                            {log.execution_id && (
                              <span className="bg-[var(--muted)] px-2 py-0.5 rounded">
                                Execution: {log.execution_id.slice(-8)}
                              </span>
                            )}
                            {log.node_id && (
                              <span className="bg-[var(--muted)] px-2 py-0.5 rounded">
                                Node: {log.node_id}
                              </span>
                            )}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {log.metadata &&
                              Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-[var(--foreground)] mb-1">
                                    Metadata:
                                  </h4>
                                  <pre className="text-xs bg-[var(--muted)] p-2 rounded border overflow-x-auto">
                                    <code>
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </code>
                                  </pre>
                                </div>
                              )}

                            {log.stack_trace && (
                              <div>
                                <h4 className="text-xs font-medium text-[var(--foreground)] mb-1">
                                  Stack Trace:
                                </h4>
                                <pre className="text-xs bg-[var(--muted)] p-2 rounded border overflow-x-auto font-mono">
                                  <code>{log.stack_trace}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => copyLogEntry(log)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[var(--muted)] rounded transition-all"
                        title="Copy log entry"
                      >
                        {copiedLogId === log.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted-foreground)]" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
