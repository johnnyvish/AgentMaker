export interface WorkflowContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce(
      (acc, key) =>
        acc && typeof acc === "object" && key in acc
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj
    );
}

/**
 * Interpolate {{ … }} placeholders.
 *   • quoteStrings = false  → bare values (for Slack, e-mail, etc.)
 *   • quoteStrings = true   → strings are JSON-quoted (for eval)
 */
export function parseExpression(
  str: unknown,
  ctx: WorkflowContext,
  quoteStrings = false
): unknown {
  if (typeof str !== "string") return str;

  return str.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const trimmed = expr.trim();

    // Debug logging
    console.log(`🔍 Parsing expression: ${trimmed}`);

    // ---------------- $node ----------------
    if (trimmed.startsWith("$node.")) {
      const [, nodeId, ...rest] = trimmed.split(".");
      const nodeOutput = ctx.nodeOutputs[nodeId];
      console.log(`📊 Node ${nodeId} output:`, nodeOutput);

      if (!nodeOutput) {
        console.warn(`⚠️ Node output not found for: ${nodeId}`);
        return match; // Return original if not found
      }

      const value = getNestedValue(nodeOutput, rest.join("."));
      console.log(`✅ Resolved value:`, value);
      return serialise(value, quoteStrings);
    }

    // ---------------- $vars ----------------
    if (trimmed.startsWith("$vars.")) {
      const [, varName, ...rest] = trimmed.split(".");
      const base = ctx.variables[varName];
      console.log(`📝 Variable ${varName}:`, base);

      if (base === undefined) {
        console.warn(`⚠️ Variable not found: ${varName}`);
        return match;
      }

      const value =
        rest.length === 0 ? base : getNestedValue(base, rest.join("."));
      return serialise(value, quoteStrings);
    }

    console.warn(`❌ Unknown expression pattern: ${trimmed}`);
    return match; // leave untouched
  });
}

function serialise(v: unknown, quoteStrings: boolean): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") {
    // When quoteStrings === true we want a JS string literal
    //   high  →  'high'
    //   foo's →  'foo\'s'
    return quoteStrings ? `'${String(v).replace(/'/g, "\\'")}'` : v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v); // objects / arrays
}
