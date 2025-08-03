"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Node, Edge } from "@xyflow/react";
import { integrationRegistry } from "../../../lib/integrations/registry";
import type { Integration } from "../../../lib/integrations/types";
import {
  workflowTemplates,
  type WorkflowTemplate,
} from "../../../lib/integrations/templates";
import { useEditor } from "../hooks/useEditor";

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

interface ExecutionStep {
  node_id: string;
  status: string;
  completed_at?: string;
  result?: {
    success: boolean;
    data?: Record<string, unknown>;
    metadata?: {
      nodeType: string;
      subtype: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

interface ExecutionState {
  status: "idle" | "running" | "completed" | "failed";
  context: {
    variables: Record<string, unknown>;
    nodeOutputs: Record<string, unknown>;
  };
  currentNode: string | null;
}

interface AutomationContextType {
  // Workflow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowName: string;
  isEditingTitle: boolean;
  sidebarOpen: boolean;
  showExecutionPanel: boolean;
  copiedField: string | null;
  currentWorkflowId: string | null;
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (updater: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setSelectedNode: (node: Node | null) => void;
  setWorkflowName: (name: string) => void;
  setIsEditingTitle: (editing: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setShowExecutionPanel: (show: boolean) => void;
  setCopiedField: (field: string | null) => void;
  setCurrentWorkflowId: (id: string | null) => void;

  // Operations
  getIntegration: (id: string) => Integration | undefined;
  getTriggerIntegrations: () => Integration[];
  getActionIntegrations: () => Integration[];
  getLogicIntegrations: () => Integration[];
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  deleteSelectedNode: () => void;
  copyExpression: (expression: string) => void;
  copyDataFieldExpressionWithFeedback: (
    nodeId: string,
    fieldKey: string
  ) => void;
  handleTitleEdit: () => void;
  handleTitleSave: () => void;
  handleTitleKeyDown: (e: React.KeyboardEvent) => void;

  // Templates
  getTemplates: () => WorkflowTemplate[];
  applyTemplate: (templateId: string) => void;

  // Execution
  executionState: ExecutionState;
  isExecuting: boolean;
  executeWorkflow: (
    nodes: Node[],
    edges: Edge[],
    onNodeStatusChange: (
      nodeId: string,
      status: "idle" | "running" | "success" | "error",
      lastRun?: string,
      executionResult?: Record<string, unknown>
    ) => void
  ) => Promise<void>;
  saveWorkflow: (
    nodes: Node[],
    edges: Edge[],
    name: string
  ) => Promise<unknown>;
  loadWorkflow: () => Promise<unknown>;
  restoreExecutionState: (
    nodes: Node[],
    steps: ExecutionStep[],
    onNodeStatusChange: (
      nodeId: string,
      status: "idle" | "running" | "success" | "error",
      lastRun?: string,
      executionResult?: Record<string, unknown>
    ) => void
  ) => void;
  restoreLatestExecution: (
    workflowId: string
  ) => Promise<{ execution: unknown; steps: ExecutionStep[] } | null>;

  // Auto-save state
  isSaving: boolean;
  lastSaveError: string | null;
}

const AutomationContext = createContext<AutomationContextType | undefined>(
  undefined
);

export const useAutomationContext = () => {
  const context = useContext(AutomationContext);
  if (context === undefined) {
    throw new Error(
      "useAutomationContext must be used within a AutomationProvider"
    );
  }
  return context;
};

interface AutomationProviderProps {
  children: ReactNode;
}

export const AutomationProvider = ({ children }: AutomationProviderProps) => {
  // Core workflow state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // UI state
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Current workflow ID
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    null
  );

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  // Integration helpers
  const getIntegration = useCallback((id: string) => {
    return integrationRegistry.get(id);
  }, []);

  const getTriggerIntegrations = useCallback(() => {
    return integrationRegistry.getTriggers();
  }, []);

  const getActionIntegrations = useCallback(() => {
    return integrationRegistry.getActions();
  }, []);

  const getLogicIntegrations = useCallback(() => {
    return integrationRegistry.getLogic();
  }, []);

  // Node operations
  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      );

      // Also update the selectedNode state to reflect the changes immediately
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode({
          ...selectedNode,
          data: { ...selectedNode.data, config },
        });
      }
    },
    [selectedNode]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  }, [selectedNode]);

  // Copy operations
  const copyExpression = useCallback((expression: string) => {
    navigator.clipboard.writeText(expression);
  }, []);

  const copyDataFieldExpressionWithFeedback = useCallback(
    (nodeId: string, fieldKey: string) => {
      navigator.clipboard.writeText(`{{$node.${nodeId}.data.${fieldKey}}}`);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    },
    []
  );

  // Title operations
  const handleTitleEdit = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleSave = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleTitleSave();
      } else if (e.key === "Escape") {
        setIsEditingTitle(false);
      }
    },
    [handleTitleSave]
  );

  // Template operations
  const getTemplates = useCallback(() => {
    return workflowTemplates;
  }, []);

  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = workflowTemplates.find((t) => t.id === templateId);
      if (!template) return;

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

      const newNodes = template.nodes.map((n) => ({
        id: idMap.get(n.id)!,
        type: n.type,
        position: n.position,
        data: { ...n.data },
      }));

      const newEdges = template.edges.map((e) => ({
        id: `${idMap.get(e.source)}-${idMap.get(e.target)}`,
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        style: { stroke: "#d1d5db", strokeWidth: 2 },
        animated: false,
      }));

      // Replace current workflow with template
      setNodes(newNodes);
      setEdges(newEdges);
      setWorkflowName(template.name);
    },
    [setNodes, setEdges, setWorkflowName, nodes]
  );

  // Execution logic from useExecution hook
  const {
    executionState,
    isExecuting,
    saveWorkflow: saveWorkflowAPI,
    loadWorkflow: loadWorkflowAPI,
    executeWorkflow: executeWorkflowAPI,
    restoreNodeStates,
    restoreLatestExecution,
  } = useEditor(currentWorkflowId);

  // Auto-save functionality
  useEffect(() => {
    // Only auto-save if we have nodes or edges and a workflow name
    if ((nodes.length > 0 || edges.length > 0) && workflowName.trim()) {
      const timeoutId = setTimeout(async () => {
        try {
          setIsSaving(true);
          setLastSaveError(null);
          console.log("Auto-saving workflow...", {
            nodes: nodes.length,
            edges: edges.length,
          });

          const result = await saveWorkflowAPI(nodes, edges, workflowName);

          // Update currentWorkflowId if this is a new workflow
          if (
            result &&
            typeof result === "object" &&
            "id" in result &&
            !currentWorkflowId
          ) {
            setCurrentWorkflowId(result.id as string);
            // Update URL to reflect the new automation ID
            window.history.replaceState({}, "", `/editor?id=${result.id}`);
          }

          console.log("Auto-save successful");
        } catch (error) {
          console.error("Auto-save failed:", error);
          setLastSaveError(
            error instanceof Error ? error.message : "Save failed"
          );
        } finally {
          setIsSaving(false);
        }
      }, 2000); // Save 2 seconds after changes stop

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, workflowName, saveWorkflowAPI, currentWorkflowId]);

  const executeWorkflow = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      onNodeStatusChange: (
        nodeId: string,
        status: "idle" | "running" | "success" | "error",
        lastRun?: string,
        executionResult?: Record<string, unknown>
      ) => void
    ) => {
      await executeWorkflowAPI(nodes, edges, onNodeStatusChange);
    },
    [executeWorkflowAPI]
  );

  const saveWorkflow = useCallback(
    async (nodes: Node[], edges: Edge[], name: string) => {
      const result = await saveWorkflowAPI(nodes, edges, name);
      if (
        result &&
        typeof result === "object" &&
        "id" in result &&
        !currentWorkflowId
      ) {
        setCurrentWorkflowId(result.id as string);
      }
      return result;
    },
    [saveWorkflowAPI, currentWorkflowId, setCurrentWorkflowId]
  );

  const loadWorkflow = useCallback(async () => {
    return await loadWorkflowAPI();
  }, [loadWorkflowAPI]);

  const restoreExecutionState = useCallback(
    (
      nodes: Node[],
      steps: ExecutionStep[],
      onNodeStatusChange: (
        nodeId: string,
        status: "idle" | "running" | "success" | "error",
        lastRun?: string,
        executionResult?: Record<string, unknown>
      ) => void
    ) => {
      restoreNodeStates(nodes, steps, onNodeStatusChange);
    },
    [restoreNodeStates]
  );

  // Create wrapper functions that handle the type conversion
  const setNodesWrapper = useCallback(
    (updater: Node[] | ((prev: Node[]) => Node[])) => {
      setNodes(updater);
    },
    []
  );

  const setEdgesWrapper = useCallback(
    (updater: Edge[] | ((prev: Edge[]) => Edge[])) => {
      setEdges(updater);
    },
    []
  );

  const value = {
    // State
    nodes,
    setNodes: setNodesWrapper,
    edges,
    setEdges: setEdgesWrapper,
    selectedNode,
    setSelectedNode,
    workflowName,
    setWorkflowName,
    isEditingTitle,
    setIsEditingTitle,
    sidebarOpen,
    setSidebarOpen,
    showExecutionPanel,
    setShowExecutionPanel,
    copiedField,
    setCopiedField,
    currentWorkflowId,
    setCurrentWorkflowId,
    isSaving,
    lastSaveError,

    // Operations
    getIntegration,
    getTriggerIntegrations,
    getActionIntegrations,
    getLogicIntegrations,
    updateNodeConfig,
    deleteSelectedNode,
    copyExpression,
    copyDataFieldExpressionWithFeedback,
    handleTitleEdit,
    handleTitleSave,
    handleTitleKeyDown,

    // Templates
    getTemplates,
    applyTemplate,

    // Execution
    executionState,
    isExecuting,
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    restoreExecutionState,
    restoreLatestExecution,
  };

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  );
};
