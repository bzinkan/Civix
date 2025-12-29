"use client";

import { useEffect, useMemo, useState } from "react";
import DecisionFlow from "../../components/DecisionFlow";
import DecisionResult from "../../components/DecisionResult";
import type { DecisionOutput } from "../../lib/rules-engine";

type FlowSummary = {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  jurisdictionId: string;
};

export default function DashboardPage() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [jurisdictionId, setJurisdictionId] = useState("");
  const [result, setResult] = useState<DecisionOutput | null>(null);

  useEffect(() => {
    const loadFlows = async () => {
      const response = await fetch("/api/flows");
      if (!response.ok) {
        return;
      }
      const data: FlowSummary[] = await response.json();
      setFlows(data);
      if (data.length > 0) {
        setSelectedFlowId(data[0].id);
        setJurisdictionId(data[0].jurisdictionId);
      }
    };

    void loadFlows();
  }, []);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId),
    [flows, selectedFlowId]
  );

  useEffect(() => {
    if (selectedFlow) {
      setJurisdictionId(selectedFlow.jurisdictionId);
    }
  }, [selectedFlow]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <h1>Decision Engine Sandbox</h1>
        <p className="muted">
          Walk through a deterministic decision flow and review the resulting
          compliance outcome.
        </p>
      </section>

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          <span className="muted">Decision flow</span>
          <select
            value={selectedFlowId}
            onChange={(event) => {
              setSelectedFlowId(event.target.value);
              setResult(null);
            }}
          >
            {flows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.label ?? flow.name}
              </option>
            ))}
          </select>
        </label>
        {selectedFlow?.description && (
          <p className="muted">{selectedFlow.description}</p>
        )}
      </section>

      <section>
        <DecisionFlow
          flowId={selectedFlowId}
          jurisdictionId={jurisdictionId}
          onDecision={setResult}
        />
      </section>

      <section>
        <DecisionResult result={result} />
      </section>
    </div>
  );
}
