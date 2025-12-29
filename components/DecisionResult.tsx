"use client";

import type { DecisionOutput } from "../lib/rules-engine";

type DecisionResultProps = {
  result: DecisionOutput | null;
};

const outcomeLabels: Record<DecisionOutput["outcome"], string> = {
  approved: "Approved",
  conditional: "Conditional",
  denied: "Denied",
  needs_review: "Needs review",
  inconclusive: "Inconclusive"
};

const outcomeColors: Record<DecisionOutput["outcome"], string> = {
  approved: "#16a34a",
  conditional: "#0f766e",
  denied: "#dc2626",
  needs_review: "#d97706",
  inconclusive: "#6b7280"
};

export default function DecisionResult({ result }: DecisionResultProps) {
  if (!result) {
    return (
      <div className="card">
        <p className="muted">Run the decision flow to see results.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            background: outcomeColors[result.outcome],
            color: "white",
            padding: "6px 12px",
            borderRadius: 999,
            fontWeight: 600
          }}
        >
          {outcomeLabels[result.outcome]}
        </span>
        <span className="muted">
          {result.rulesApplied.length} rule(s) applied
        </span>
      </div>

      <div>
        <h4>Reasoning</h4>
        <ul>
          {result.reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Citations</h4>
        <ul>
          {result.citations.map((citation, index) => (
            <li key={`${citation.ordinanceCode ?? "citation"}-${index}`}>
              {citation.ordinanceCode ?? "Ordinance reference"}{" "}
              {citation.sourceUrl && (
                <a
                  href={citation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="muted"
                >
                  (source)
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Rules applied</h4>
        <ul>
          {result.rulesApplied.map((rule) => (
            <li key={rule.ruleId}>
              <strong>{rule.name}</strong> — {rule.outcome} (priority{" "}
              {rule.priority})
            </li>
          ))}
        </ul>
      </div>

      {result.recommendations.length > 0 && (
        <div>
          <h4>Recommendations</h4>
          <ul>
            {result.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
