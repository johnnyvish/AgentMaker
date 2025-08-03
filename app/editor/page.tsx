"use client";

import { useState, useCallback, useEffect, DragEvent } from "react";
import Link from "next/link";
import { useThemeToggle } from "../../hooks/useThemeToggle";
import { useEditor } from "../../hooks/useEditor";
import { integrationRegistry } from "../../lib/integrations";
import { getIcon } from "../../hooks/useIcons";
import LogsPanel from "../../components/LogsPanel";
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Node,
  Edge,
  NodeTypes,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, FileText, Copy as CopyIcon } from "lucide-react";

// ============================================
// TYPE DEFINITIONS
// ============================================

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

// ============================================
// CUSTOM NODE COMPONENTS
// ============================================

const BaseNode = ({
  data,
  selected,
  icon,
}: {
  data: NodeData;
  selected: boolean;
  icon: string;
}) => {
  const getStatusIndicator = () => {
    switch (data.status) {
      case "running":
        return <div className="w-2 h-2 bg-black rounded-full animate-pulse" />;
      case "success":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "error":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
    }
  };

  const getIconComponent = () => {
    const colorClass = data.colorClass || "text-[var(--foreground)]";
    return getIcon(icon, "w-5 h-5", colorClass);
  };

  const getBorderClasses = () => {
    if (selected) {
      return (
        data.selectedBorderClass ||
        "border-gray-800 dark:border-gray-200 shadow-lg ring-1 ring-gray-500/20 dark:ring-gray-400/20"
      );
    } else {
      return (
        data.borderClass ||
        "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      );
    }
  };

  return (
    <div
      className={`
        relative bg-[var(--card)] rounded-xl shadow-sm border transition-all duration-200
        min-w-[180px] px-5 py-4 group hover:shadow-md
        ${getBorderClasses()}
      `}
    >
      {/* Only show left handle for non-trigger nodes or triggers that support input */}
      {data.subtype !== "manual_trigger" &&
        data.subtype !== "webhook_trigger" &&
        data.subtype !== "schedule_trigger" && (
          <Handle
            type="target"
            position={Position.Left}
            style={{
              background: "#6b7280",
              width: 12,
              height: 12,
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            className="hover:bg-gray-600 transition-colors"
          />
        )}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#6b7280",
          width: 12,
          height: 12,
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        className="hover:bg-gray-600 transition-colors"
      />
      {/* Status indicator */}
      <div className="absolute top-3 right-3">{getStatusIndicator()}</div>

      {/* Content */}
      <div className="pr-6">
        <div className="flex items-center gap-3 mb-2">
          {getIconComponent()}
          <h3 className="font-medium text-[var(--foreground)] leading-tight">
            {data.label}
          </h3>
        </div>

        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {data.description || "Not configured"}
        </p>

        {data.lastRun && (
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            {data.lastRun}
          </p>
        )}
      </div>
    </div>
  );
};

const TriggerNode = ({
  data,
  selected,
}: {
  data: NodeData;
  selected: boolean;
}) => <BaseNode data={data} selected={selected} icon={data.icon || "zap"} />;

const ActionNode = ({
  data,
  selected,
}: {
  data: NodeData;
  selected: boolean;
}) => <BaseNode data={data} selected={selected} icon={data.icon || "circle"} />;

const ConditionNode = ({
  data,
  selected,
}: {
  data: NodeData;
  selected: boolean;
}) => (
  <BaseNode data={data} selected={selected} icon={data.icon || "diamond"} />
);

// Register custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  logic: ConditionNode, // Logic nodes should use the ConditionNode component
};

// ============================================
// MAIN APP COMPONENT
// ============================================

function WorkflowEditor() {
  const { theme, toggleTheme, mounted } = useThemeToggle();
  const {
    getIntegration,
    getTriggerIntegrations,
    getActionIntegrations,
    getLogicIntegrations,
  } = {
    getIntegration: (id: string) => integrationRegistry.get(id),
    getTriggerIntegrations: () => integrationRegistry.getTriggers(),
    getActionIntegrations: () => integrationRegistry.getActions(),
    getLogicIntegrations: () => integrationRegistry.getLogic(),
  };
  const { screenToFlowPosition } = useReactFlow();
  const connectionLineStyle = { stroke: "#d1d5db", strokeWidth: 2 };

  // Core workflow state
  const [nodes, setNodes] = useState<Node[]>([]);

  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // UI state
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState(false);

  // Workflow engine hook
  const {
    executionState,
    isExecuting,
    saveWorkflow: saveWorkflowAPI,
    loadWorkflow: loadWorkflowAPI,
    executeWorkflow: executeWorkflowAPI,
    restoreNodeStates,
  } = useEditor();

  // Auto-save on changes
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (nodes.length > 0) {
        // Only save if there are nodes
        saveWorkflowAPI(nodes, edges, workflowName).catch(console.error);
      }
    }, 1000);

    return () => clearTimeout(autoSave);
  }, [nodes, edges, workflowName, saveWorkflowAPI]);

  // Load saved workflow on mount
  useEffect(() => {
    const loadSavedWorkflow = async () => {
      const saved = await loadWorkflowAPI();
      if (saved) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        setWorkflowName(saved.name);

        // 🔧 NEW: Restore execution state if available
        if (saved.restoredExecution?.steps) {
          console.log("🔄 Restoring node states from execution");

          // Small delay to ensure nodes are rendered
          setTimeout(() => {
            const onNodeStatusChange = (
              nodeId: string,
              status: "idle" | "running" | "success" | "error",
              lastRun?: string,
              executionResult?: Record<string, unknown>
            ) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === nodeId
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          status,
                          lastRun,
                          executionResult,
                        },
                      }
                    : n
                )
              );
            };

            restoreNodeStates(
              saved.nodes,
              saved.restoredExecution!.steps,
              onNodeStatusChange
            );
          }, 100);
        }

        console.log("Loaded workflow with execution state:", saved);
      }
    };

    loadSavedWorkflow();
  }, [loadWorkflowAPI, restoreNodeStates]);

  // ============================================
  // REACTFLOW EVENT HANDLERS
  // ============================================

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          style: { stroke: "#d1d5db", strokeWidth: 2 },
          animated: false,
        },
        eds
      )
    );
  }, []);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    // If no nodes are selected, clear the selectedNode
    if (nodes.length === 0) {
      setSelectedNode(null);
    }
  }, []);

  // ============================================
  // DRAG & DROP FUNCTIONALITY
  // ============================================

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const nodeData = event.dataTransfer.getData("application/reactflow");
      if (!nodeData) return;

      const {
        type,
        label,
        subtype,
        icon,
        description,
        colorClass,
        borderClass,
        selectedBorderClass,
      } = JSON.parse(nodeData);

      // Convert screen coordinates to flow coordinates (accounts for zoom and pan)
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label,
          subtype, // This is now the integration ID
          icon,
          description,
          status: "idle",
          colorClass,
          borderClass,
          selectedBorderClass,
          config: { integrationId: subtype }, // Add this line
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition]
  );

  const onDragStart = (
    event: DragEvent,
    nodeType: string,
    label: string,
    subtype: string,
    icon: string,
    description: string,
    colorClass: string,
    borderClass: string,
    selectedBorderClass: string
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: nodeType,
        label,
        subtype,
        icon,
        description,
        colorClass,
        borderClass,
        selectedBorderClass,
      })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // ============================================
  // WORKFLOW OPERATIONS
  // ============================================

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const executeWorkflow = async () => {
    const onNodeStatusChange = (
      nodeId: string,
      status: "idle" | "running" | "success" | "error",
      lastRun?: string,
      executionResult?: Record<string, unknown>
    ) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  status,
                  lastRun,
                  executionResult,
                },
              }
            : n
        )
      );
    };

    setShowExecutionPanel(true);
    await executeWorkflowAPI(nodes, edges, onNodeStatusChange);
  };

  const updateNodeConfig = (
    nodeId: string,
    config: Record<string, unknown>
  ) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
      )
    );

    // Also update the selectedNode state to reflect the changes immediately
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, config },
      });
    }
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const renderSidebarIcon = (
    iconName: string,
    nodeData: { colorClass?: string }
  ) => {
    const colorClass = nodeData.colorClass || "text-[var(--foreground)]";
    return getIcon(iconName, "w-5 h-5", colorClass);
  };

  const copyExpression = (expression: string) => {
    navigator.clipboard.writeText(expression);
    // Could show a little toast here if you weren't so lazy
  };

  // State to track which field was just copied for visual feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Enhanced copy function with visual feedback
  const copyDataFieldExpressionWithFeedback = (
    nodeId: string,
    fieldKey: string
  ) => {
    navigator.clipboard.writeText(`{{$node.${nodeId}.data.${fieldKey}}}`);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500); // Reset after 1.5 seconds
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* TOP BAR - Workflow Title and Menu */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Home Button */}
            <Link
              href="/"
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              aria-label="Go to home"
            >
              {getIcon("dashboard", "w-6 h-6", "text-[var(--foreground)]")}
            </Link>

            <div className="flex items-center gap-4">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-xl font-semibold text-[var(--foreground)] bg-[var(--card)] border border-[var(--border)] rounded-md shadow-sm focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] focus:outline-none px-3 py-1"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-xl font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--muted-foreground)] transition-colors px-1 py-0.5 rounded"
                  onClick={handleTitleEdit}
                  title="Click to edit title"
                >
                  {workflowName}
                </h1>
              )}
            </div>
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
            <button
              onClick={() => setShowLogsPanel(true)}
              className="p-2 text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="View system logs"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowExecutionPanel(true)}
              className="p-2 text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="View execution details"
            >
              {getIcon("activity", "w-4 h-4")}
            </button>
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isExecuting
                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                  : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
              }`}
            >
              {isExecuting ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </div>
              ) : (
                "Run"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Node Library */}
        <div
          className={`
          bg-[var(--card)] border-r border-[var(--border)] transition-colors duration-200 flex flex-col
          ${sidebarOpen ? "w-80" : "w-0 overflow-hidden"}
        `}
        >
          <div className="flex-1 overflow-y-auto px-6 pb-4 pl-6 pt-4 custom-scrollbar">
            <div className="space-y-6">
              {/* Triggers Section */}
              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Triggers
                    </h3>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      {getIcon("x", "w-4 h-4", "text-[var(--foreground)]")}
                    </button>
                  </div>
                  {getTriggerIntegrations().map((integration, index) => (
                    <div
                      key={`trigger-${index}`}
                      className={`p-3 border rounded-lg cursor-move hover:shadow-sm transition-all group bg-[var(--card)] ${
                        integration.borderClass ||
                        "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(
                          e,
                          integration.category,
                          integration.name,
                          integration.id,
                          integration.icon,
                          integration.description,
                          integration.colorClass,
                          integration.borderClass,
                          integration.selectedBorderClass
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {renderSidebarIcon(integration.icon, integration)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[var(--foreground)] text-sm leading-snug">
                            {integration.name}
                          </h3>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              <div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                    Actions
                  </h3>
                  {getActionIntegrations().map((integration, index) => (
                    <div
                      key={`action-${index}`}
                      className={`p-3 border rounded-lg cursor-move hover:shadow-sm transition-all group bg-[var(--card)] ${
                        integration.borderClass ||
                        "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(
                          e,
                          integration.category,
                          integration.name,
                          integration.id,
                          integration.icon,
                          integration.description,
                          integration.colorClass,
                          integration.borderClass,
                          integration.selectedBorderClass
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {renderSidebarIcon(integration.icon, integration)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[var(--foreground)] text-sm leading-snug">
                            {integration.name}
                          </h3>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logic Section */}
              <div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                    Logic
                  </h3>
                  {getLogicIntegrations().map((integration, index) => (
                    <div
                      key={`logic-${index}`}
                      className={`p-3 border rounded-lg cursor-move hover:shadow-sm transition-all group bg-[var(--card)] ${
                        integration.borderClass ||
                        "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(
                          e,
                          integration.category,
                          integration.name,
                          integration.id,
                          integration.icon,
                          integration.description,
                          integration.colorClass,
                          integration.borderClass,
                          integration.selectedBorderClass
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {renderSidebarIcon(integration.icon, integration)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[var(--foreground)] text-sm leading-snug">
                            {integration.name}
                          </h3>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-6 left-6 z-10 p-3 bg-[var(--primary)] rounded-xl shadow-lg hover:bg-[var(--primary)]/90 transition-colors"
            >
              {getIcon("plus", "w-6 h-6", "text-[var(--primary-foreground)]")}
            </button>
          )}
          <div className="relative w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onSelectionChange={onSelectionChange}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              className="bg-[var(--background)]"
              connectionLineStyle={connectionLineStyle}
              defaultEdgeOptions={{
                style: { stroke: "#d1d5db", strokeWidth: 2 },
                animated: false,
              }}
              panOnDrag
              elementsSelectable
              nodesConnectable
              nodesDraggable
              proOptions={{ hideAttribution: true }}
            >
              <Background
                color={theme === "dark" ? "#6b7280" : "#d1d5db"}
                gap={20}
                size={theme === "dark" ? 1.5 : 2}
                variant={BackgroundVariant.Dots}
              />
            </ReactFlow>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Configuration or Execution Panel */}
        {(selectedNode || showExecutionPanel) && (
          <div className="w-80 bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto">
            <div className="p-6">
              {showExecutionPanel ? (
                /* Execution Panel */
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
                        {Object.keys(executionState.context.variables).length >
                        0
                          ? JSON.stringify(
                              executionState.context.variables,
                              null,
                              2
                            )
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
                      {Object.keys(executionState.context.nodeOutputs)
                        .length === 0 ? (
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
              ) : (
                selectedNode && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--muted)] rounded-lg">
                          {getIcon(
                            (selectedNode.data as unknown as NodeData).icon ||
                              "circle",
                            "w-5 h-5",
                            "text-[var(--muted-foreground)]"
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-[var(--foreground)]">
                            {(selectedNode.data as unknown as NodeData).label}
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
                    {(selectedNode.data as unknown as NodeData)
                      .executionResult && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                          Output
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(
                            ((selectedNode.data as unknown as NodeData)
                              .executionResult?.data as Record<
                              string,
                              unknown
                            >) || {}
                          ).map((fieldKey) => (
                            <button
                              key={fieldKey}
                              onClick={() =>
                                copyDataFieldExpressionWithFeedback(
                                  selectedNode.id,
                                  fieldKey
                                )
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
                        {(() => {
                          const nodeData =
                            selectedNode.data as unknown as NodeData;
                          const integrationId = nodeData.subtype;
                          const integration = getIntegration(
                            integrationId || ""
                          );

                          if (!integration) {
                            return (
                              <div className="text-red-500 text-sm">
                                Integration not found: {integrationId}
                              </div>
                            );
                          }

                          return integration.schema.fields.map((field) => (
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
                                  value={
                                    ((selectedNode.data as unknown as NodeData)
                                      .config?.[field.key] as string) || ""
                                  }
                                  onChange={(e) => {
                                    const currentConfig =
                                      (selectedNode.data as unknown as NodeData)
                                        .config || {};
                                    updateNodeConfig(selectedNode.id, {
                                      ...currentConfig,
                                      [field.key]: e.target.value,
                                    });
                                  }}
                                >
                                  <option value="">Select {field.label}</option>
                                  {Array.isArray(field.options) &&
                                    field.options.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                </select>
                              ) : field.type === "textarea" ? (
                                <textarea
                                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]/10 transition-all bg-[var(--muted)]/50 resize-none"
                                  rows={3}
                                  placeholder={field.placeholder}
                                  value={
                                    ((selectedNode.data as unknown as NodeData)
                                      .config?.[field.key] as string) || ""
                                  }
                                  onChange={(e) => {
                                    const currentConfig =
                                      (selectedNode.data as unknown as NodeData)
                                        .config || {};
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
                                  value={
                                    ((selectedNode.data as unknown as NodeData)
                                      .config?.[field.key] as string) || ""
                                  }
                                  onChange={(e) => {
                                    const currentConfig =
                                      (selectedNode.data as unknown as NodeData)
                                        .config || {};
                                    updateNodeConfig(selectedNode.id, {
                                      ...currentConfig,
                                      [field.key]: e.target.value,
                                    });
                                  }}
                                />
                              )}

                              {field.supportExpressions && (
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                  Use {"{{$node.NodeId.data.field}}"} to
                                  reference previous nodes or{" "}
                                  {"{{$vars.variableName}}"} for variables
                                </p>
                              )}
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Available Data Section */}
                      <div className="space-y-4 border-t border-[var(--border)] pt-6">
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">
                          Available Data
                        </h3>

                        {/* Previous Node Outputs */}
                        {Object.keys(executionState.context.nodeOutputs)
                          .length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                              From Previous Nodes:
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {Object.entries(
                                executionState.context.nodeOutputs
                              ).map(([nodeId, output]) => (
                                <div
                                  key={nodeId}
                                  className="bg-[var(--muted)]/50 rounded p-2"
                                >
                                  <button
                                    onClick={() =>
                                      copyExpression(
                                        `{{$node.${nodeId}.data.FIELD}}`
                                      )
                                    }
                                    className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--primary)] cursor-pointer mb-1 block w-full text-left"
                                    title="Click to copy"
                                  >
                                    {`{{$node.${nodeId}.data.FIELD}}`}
                                  </button>
                                  <div className="text-xs text-[var(--muted-foreground)]">
                                    Available fields:{" "}
                                    {Object.keys(
                                      ((output as Record<string, unknown>)
                                        ?.data as Record<string, unknown>) || {}
                                    ).join(", ") || "none"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variables */}
                        {Object.keys(executionState.context.variables).length >
                          0 && (
                          <div>
                            <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                              Variables:
                            </h4>
                            <div className="bg-[var(--muted)]/50 rounded p-2">
                              {Object.keys(
                                executionState.context.variables
                              ).map((varName) => (
                                <button
                                  key={varName}
                                  onClick={() =>
                                    copyExpression(`{{$vars.${varName}}}`)
                                  }
                                  className="text-xs font-mono text-[var(--foreground)] hover:text-[var(--primary)] cursor-pointer block w-full text-left"
                                  title="Click to copy"
                                >
                                  {`{{$vars.${varName}}}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Helpful hint when nothing is available */}
                        {Object.keys(executionState.context.nodeOutputs)
                          .length === 0 &&
                          Object.keys(executionState.context.variables)
                            .length === 0 && (
                            <div className="text-xs text-[var(--muted-foreground)] italic">
                              Run previous nodes to see available data
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* Logs Panel */}
        <LogsPanel
          isOpen={showLogsPanel}
          onClose={() => setShowLogsPanel(false)}
          workflowId={undefined}
          executionId={executionState.context.executionId || undefined}
        />
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    fetch("/api/start-background", { method: "POST" }).catch(console.error);
  }, []);

  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
