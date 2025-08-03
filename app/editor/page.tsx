"use client";

import { useCallback, useEffect, DragEvent } from "react";
import { useThemeToggle } from "../../hooks/useThemeToggle";
import { getIcon } from "../../hooks/useIcons";
import { useSearchParams } from "next/navigation";
import type { WorkflowTemplate } from "../../lib/integrations/templates";

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

// Import extracted components
import TopBar from "./components/TopBar";
import NodeLibraryPanel from "./components/NodeLibraryPanel";
import ConfigurationPanel from "./components/ConfigurationPanel";
import ExecutionPanel from "./components/ExecutionPanel";
import {
  AutomationProvider,
  useAutomationContext,
} from "./context/AutomationContext";

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

// ------------------------------------------------
// NODE-ID UTIL
// ------------------------------------------------
const nextNodeId = (existing: Node[], base: string) => {
  // base = webhook_trigger   →  webhook_trigger-1, -2, …
  const re = new RegExp(`^${base}-(\\d+)$`);
  const max = existing.reduce((highest, n) => {
    const m = n.id.match(re);
    return m ? Math.max(highest, Number(m[1])) : highest;
  }, 0);
  return `${base}-${max + 1}`;
};

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

        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-[200px] break-words">
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

function WorkflowEditorContent() {
  const { theme } = useThemeToggle();
  const { screenToFlowPosition } = useReactFlow();
  const connectionLineStyle = { stroke: "#d1d5db", strokeWidth: 2 };
  const searchParams = useSearchParams();
  const automationId = searchParams.get("id");

  // Get state from context
  const {
    nodes,
    edges,
    selectedNode,
    sidebarOpen,
    showExecutionPanel,
    setNodes,
    setEdges,
    setSelectedNode,
    setSidebarOpen,
    setShowExecutionPanel,
    setWorkflowName,
    setCurrentWorkflowId,
    restoreLatestExecution,
    restoreExecutionState,
  } = useAutomationContext();

  // Load automation from URL parameter
  useEffect(() => {
    const loadAutomationFromUrl = async () => {
      if (automationId) {
        try {
          const response = await fetch("/api/automations");
          if (response.ok) {
            const automations = await response.json();
            const automation = automations.find(
              (a: { id: string }) => a.id === automationId
            );
            if (automation) {
              setNodes(automation.nodes || []);
              setEdges(automation.edges || []);
              setWorkflowName(automation.name);
              setCurrentWorkflowId(automation.id);

              // 🎯 THE MISSING PIECE: Restore execution state
              try {
                const restoredExecution = await restoreLatestExecution(
                  automation.id
                );

                if (restoredExecution) {
                  console.log("✅ Execution state restored from database");

                  // Restore visual node states
                  if (restoredExecution.steps) {
                    restoreExecutionState(
                      automation.nodes || [],
                      restoredExecution.steps,
                      (
                        nodeId: string,
                        status: "idle" | "running" | "success" | "error",
                        lastRun?: string,
                        executionResult?: Record<string, unknown>
                      ) => {
                        // Update node visual states
                        setNodes((currentNodes) =>
                          currentNodes.map((node) =>
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
                      }
                    );
                  }
                } else {
                  console.log(
                    "ℹ️ No previous execution found for this workflow"
                  );
                }
              } catch (error) {
                console.error("Failed to restore execution state:", error);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load automation:", error);
        }
      } else {
        // Clear everything for new automation
        setNodes([]);
        setEdges([]);
        setWorkflowName("Untitled Workflow");
        setCurrentWorkflowId(null);
      }
    };

    loadAutomationFromUrl();
  }, [
    automationId,
    setNodes,
    setEdges,
    setWorkflowName,
    setCurrentWorkflowId,
    restoreLatestExecution,
    restoreExecutionState,
  ]);

  // ============================================
  // REACTFLOW EVENT HANDLERS
  // ============================================

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#d1d5db", strokeWidth: 2 },
            animated: false,
          } as Edge,
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      // Close execution panel when a node is clicked
      setShowExecutionPanel(false);
    },
    [setSelectedNode, setShowExecutionPanel]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      // If no nodes are selected, clear the selectedNode
      if (nodes.length === 0) {
        setSelectedNode(null);
      }
    },
    [setSelectedNode]
  );

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

      // Check if it's a template first
      const templateData = event.dataTransfer.getData(
        "application/reactflow/template"
      );
      if (templateData) {
        const template: WorkflowTemplate = JSON.parse(templateData);

        // Convert screen coordinates to flow coordinates
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        /* ---------- keep ids from the template ----------- */
        const idMap = new Map<string, string>();
        template.nodes.forEach((n) => {
          // only change the id if it already exists on the canvas
          const clash = nodes.find((x) => x.id === n.id);
          if (clash) {
            idMap.set(n.id, nextNodeId(nodes, n.data.subtype || n.type));
          } else {
            idMap.set(n.id, n.id);
          }
        });

        /* ---------- offset positions so the group lands where the user dropped it --------- */
        const templateBounds = template.nodes.reduce(
          (b, n) => ({
            minX: Math.min(b.minX, n.position.x),
            minY: Math.min(b.minY, n.position.y),
          }),
          { minX: Infinity, minY: Infinity }
        );

        const newNodes = template.nodes.map((n) => ({
          id: idMap.get(n.id)!,
          type: n.type,
          position: {
            x: position.x + (n.position.x - templateBounds.minX),
            y: position.y + (n.position.y - templateBounds.minY),
          },
          data: { ...n.data },
        }));

        const newEdges = template.edges.map((e) => ({
          id: `${idMap.get(e.source)}-${idMap.get(e.target)}`,
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
          style: { stroke: "#d1d5db", strokeWidth: 2 },
          animated: false,
        }));

        // Add template nodes and edges to existing workflow
        setNodes((nds: Node[]) => [...nds, ...newNodes]);
        setEdges((eds: Edge[]) => [...eds, ...newEdges]);

        return;
      }

      // Original single node drop logic
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
        id: nextNodeId(nodes, subtype || type),
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

      setNodes((nds: Node[]) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes, setEdges]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <NodeLibraryPanel />

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
                <ExecutionPanel />
              ) : (
                selectedNode && <ConfigurationPanel />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowEditor() {
  return (
    <AutomationProvider>
      <WorkflowEditorContent />
    </AutomationProvider>
  );
}

export default function App() {
  useEffect(() => {
    fetch("/api/init", { method: "POST" }).catch(console.error);
  }, []);

  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
