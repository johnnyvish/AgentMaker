"use client";

import { useState, useMemo } from "react";
import { getIcon } from "../../../hooks/useIcons";
import { useAutomationContext } from "../context/AutomationContext";
import type { Integration } from "../../../lib/integrations/types";
import type { WorkflowTemplate } from "../../../lib/integrations/templates";

const NodeLibraryPanel = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    getTriggerIntegrations,
    getActionIntegrations,
    getLogicIntegrations,
    getTemplates,
  } = useAutomationContext();

  const [searchTerm, setSearchTerm] = useState("");

  const renderSidebarIcon = (
    iconName: string,
    nodeData: { colorClass?: string }
  ) => {
    const colorClass = nodeData.colorClass || "text-[var(--foreground)]";
    return getIcon(iconName, "w-5 h-5", colorClass);
  };

  const onDragStart = (
    event: React.DragEvent,
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

  // Filter integrations based on search term
  const filteredTriggers = useMemo(() => {
    if (!searchTerm) return getTriggerIntegrations();
    return getTriggerIntegrations().filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, getTriggerIntegrations]);

  const filteredActions = useMemo(() => {
    if (!searchTerm) return getActionIntegrations();
    return getActionIntegrations().filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, getActionIntegrations]);

  const filteredLogic = useMemo(() => {
    if (!searchTerm) return getLogicIntegrations();
    return getLogicIntegrations().filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, getLogicIntegrations]);

  // Add filtered templates
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return getTemplates();
    return getTemplates().filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, getTemplates]);

  const renderIntegrationCard = (
    integration: Integration,
    category: string,
    index: number
  ) => (
    <div
      key={`${category}-${index}`}
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
          integration.colorClass || "",
          integration.borderClass || "",
          integration.selectedBorderClass || ""
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
  );

  // Add template card renderer
  const renderTemplateCard = (template: WorkflowTemplate, index: number) => (
    <div
      key={`template-${index}`}
      className="p-3 border rounded-lg cursor-move hover:shadow-sm transition-all group bg-[var(--card)] border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700"
      draggable
      onDragStart={(e) => onDragStartTemplate(e, template)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon(
            template.icon,
            "w-5 h-5",
            "text-emerald-600 dark:text-emerald-400"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[var(--foreground)] text-sm leading-snug">
            {template.name}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
            {template.description}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            {template.nodes.length} nodes
          </p>
        </div>
      </div>
    </div>
  );

  // Add this new function in the same component
  const onDragStartTemplate = (
    event: React.DragEvent,
    template: WorkflowTemplate
  ) => {
    event.dataTransfer.setData(
      "application/reactflow/template",
      JSON.stringify(template)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`
        bg-[var(--card)] border-r border-[var(--border)] transition-colors duration-200 flex flex-col
        ${sidebarOpen ? "w-80" : "w-0 overflow-hidden"}
      `}
    >
      {/* Fixed Header with Search and Close */}
      <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {getIcon("search", "w-4 h-4", "text-[var(--muted-foreground)]")}
            </div>
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-[var(--muted)] rounded-md transition-colors flex-shrink-0"
          >
            {getIcon("x", "w-4 h-4", "text-[var(--foreground)]")}
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
        <div className="space-y-6 pt-4">
          {/* Templates Section - Add this FIRST */}
          {filteredTemplates.length > 0 && (
            <div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Templates
                </h3>
                {filteredTemplates.map((template, index) =>
                  renderTemplateCard(template, index)
                )}
              </div>
            </div>
          )}

          {/* Triggers Section */}
          {filteredTriggers.length > 0 && (
            <div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Triggers
                </h3>
                {filteredTriggers.map((integration, index) =>
                  renderIntegrationCard(integration, "trigger", index)
                )}
              </div>
            </div>
          )}

          {/* Actions Section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Actions
                </h3>
                {filteredActions.map((integration, index) =>
                  renderIntegrationCard(integration, "action", index)
                )}
              </div>
            </div>
          )}

          {/* Logic Section */}
          {filteredLogic.length > 0 && (
            <div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Logic
                </h3>
                {filteredLogic.map((integration, index) =>
                  renderIntegrationCard(integration, "logic", index)
                )}
              </div>
            </div>
          )}

          {/* Update No Results Message */}
          {searchTerm &&
            filteredTemplates.length === 0 &&
            filteredTriggers.length === 0 &&
            filteredActions.length === 0 &&
            filteredLogic.length === 0 && (
              <div className="text-center py-8">
                <div className="text-[var(--muted-foreground)] text-sm">
                  No components or templates found for &quot;{searchTerm}&quot;
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NodeLibraryPanel;
