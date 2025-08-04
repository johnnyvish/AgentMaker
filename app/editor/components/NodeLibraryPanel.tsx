"use client";

import { useState } from "react";
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
  const [currentView, setCurrentView] = useState<
    "main" | "templates" | "triggers" | "actions" | "logic"
  >("main");
  const [viewHistory, setViewHistory] = useState<string[]>(["main"]);

  // Navigation functions
  const navigateToCategory = (
    categoryId: "templates" | "triggers" | "actions" | "logic"
  ) => {
    setCurrentView(categoryId);
    setViewHistory((prev) => [...prev, categoryId]);
    setSearchTerm(""); // Clear search when navigating
  };

  const navigateBack = () => {
    const newHistory = viewHistory.slice(0, -1);
    setViewHistory(newHistory);
    setCurrentView(
      (newHistory[newHistory.length - 1] as
        | "main"
        | "templates"
        | "triggers"
        | "actions"
        | "logic") || "main"
    );
    setSearchTerm(""); // Clear search when going back
  };

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

  // Get all integrations for context-aware filtering
  const allTriggers = getTriggerIntegrations();
  const allActions = getActionIntegrations();
  const allLogic = getLogicIntegrations();
  const allTemplates = getTemplates();

  // Context-aware filtering based on current view
  const getFilteredData = () => {
    if (currentView === "main") {
      // When in main view, search across all categories
      if (!searchTerm) {
        return {
          templates: allTemplates.slice(0, 2), // Show first 2
          triggers: allTriggers.slice(0, 3), // Show first 3
          actions: allActions.slice(0, 3), // Show first 3
          logic: allLogic.slice(0, 3), // Show first 3
        };
      } else {
        // Search across all categories
        return {
          templates: allTemplates.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          triggers: allTriggers.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          actions: allActions.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          logic: allLogic.filter(
            (item) =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        };
      }
    } else {
      // When in specific category view, only filter that category
      const filterFn = (item: Integration | WorkflowTemplate) =>
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      switch (currentView) {
        case "templates":
          return { [currentView]: allTemplates.filter(filterFn) };
        case "triggers":
          return { [currentView]: allTriggers.filter(filterFn) };
        case "actions":
          return { [currentView]: allActions.filter(filterFn) };
        case "logic":
          return { [currentView]: allLogic.filter(filterFn) };
        default:
          return {};
      }
    }
  };

  const filteredData = getFilteredData();

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

  const renderCategoryPreview = (
    categoryKey: "templates" | "triggers" | "actions" | "logic",
    categoryName: string,
    items: (Integration | WorkflowTemplate)[],
    totalCount: number
  ) => {
    const showViewAll = totalCount > items.length && !searchTerm;

    return (
      <div key={categoryKey}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {categoryName}
          </h3>
          {showViewAll && (
            <button
              onClick={() => navigateToCategory(categoryKey)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              View all {totalCount}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {items.map((item, index) =>
            categoryKey === "templates"
              ? renderTemplateCard(item as WorkflowTemplate, index)
              : renderIntegrationCard(item as Integration, categoryKey, index)
          )}
        </div>
      </div>
    );
  };

  const renderMainView = () => {
    const hasResults = Object.values(filteredData).some(
      (items: (Integration | WorkflowTemplate)[]) => items?.length > 0
    );

    if (searchTerm && !hasResults) {
      return (
        <div className="text-center py-8">
          <div className="text-[var(--muted-foreground)] text-sm">
            No components or templates found for &quot;{searchTerm}&quot;
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredData.templates &&
          filteredData.templates.length > 0 &&
          renderCategoryPreview(
            "templates",
            "Templates",
            filteredData.templates,
            allTemplates.length
          )}
        {filteredData.triggers &&
          filteredData.triggers.length > 0 &&
          renderCategoryPreview(
            "triggers",
            "Triggers",
            filteredData.triggers,
            allTriggers.length
          )}
        {filteredData.actions &&
          filteredData.actions.length > 0 &&
          renderCategoryPreview(
            "actions",
            "Actions",
            filteredData.actions,
            allActions.length
          )}
        {filteredData.logic &&
          filteredData.logic.length > 0 &&
          renderCategoryPreview(
            "logic",
            "Logic",
            filteredData.logic,
            allLogic.length
          )}
      </div>
    );
  };

  const renderCategoryView = () => {
    const categoryData =
      (filteredData[currentView as keyof typeof filteredData] as (
        | Integration
        | WorkflowTemplate
      )[]) || [];
    const categoryNames = {
      templates: "Templates",
      triggers: "Triggers",
      actions: "Actions",
      logic: "Logic",
    };

    const categoryName =
      categoryNames[currentView as keyof typeof categoryNames];

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {categoryData.map(
            (item: Integration | WorkflowTemplate, index: number) =>
              currentView === "templates"
                ? renderTemplateCard(item as WorkflowTemplate, index)
                : renderIntegrationCard(item as Integration, currentView, index)
          )}
        </div>

        {searchTerm && categoryData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-[var(--muted-foreground)] text-sm">
              No {categoryName.toLowerCase()} found for &quot;{searchTerm}&quot;
            </div>
          </div>
        )}

        {!searchTerm && categoryData.length === 0 && (
          <div className="text-center py-8">
            <div className="text-[var(--muted-foreground)] text-sm">
              No {categoryName.toLowerCase()} available
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSearchPlaceholder = () => {
    if (currentView === "main") {
      return "Search components...";
    }
    const categoryNames = {
      templates: "templates",
      triggers: "triggers",
      actions: "actions",
      logic: "logic components",
    };
    return `Search ${
      categoryNames[currentView as keyof typeof categoryNames]
    }...`;
  };

  const getBreadcrumb = () => {
    if (currentView === "main") return null;

    const categoryNames = {
      templates: "Templates",
      triggers: "Triggers",
      actions: "Actions",
      logic: "Logic",
    };

    return (
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={navigateBack}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {getIcon("arrow-left", "w-4 h-4")}
        </button>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {categoryNames[currentView as keyof typeof categoryNames]}
        </span>
      </div>
    );
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
              placeholder={getSearchPlaceholder()}
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
        <div className="pt-4 pb-12">
          {getBreadcrumb()}
          {currentView === "main" ? renderMainView() : renderCategoryView()}
        </div>
      </div>
    </div>
  );
};

export default NodeLibraryPanel;
