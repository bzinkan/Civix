"use client";

import { useEffect, useMemo, useState } from "react";
import type { JsonValue } from "../../../lib/json";
import type { DecisionOutput } from "../../../lib/rules-engine";

type FlowSummary = {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
};

type JurisdictionSummary = {
  id: string;
  name: string;
  state: string;
  type: string;
};

type FlowQuestion = {
  id: string;
  key: string;
  prompt: string;
  type: string;
  order: number;
  required: boolean;
  helpText?: string | null;
  options?: Array<{ label: string; value: string }> | string[];
};

type FlowResponse = {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  questions: FlowQuestion[];
};

export default function RuleTesterPage() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionSummary[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState("");
  const [flow, setFlow] = useState<FlowResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, JsonValue>>({});
  const [result, setResult] = useState<DecisionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      const [flowsResponse, jurisdictionResponse] = await Promise.all([
        fetch("/api/flows"),
        fetch("/api/jurisdictions")
      ]);
      if (flowsResponse.ok) {
        const data: FlowSummary[] = await flowsResponse.json();
        setFlows(data);
        if (data.length > 0) {
          setSelectedFlowId(data[0].id);
        }
      }
      if (jurisdictionResponse.ok) {
        const data: JurisdictionSummary[] = await jurisdictionResponse.json();
        setJurisdictions(data);
        if (data.length > 0) {
          setSelectedJurisdictionId(data[0].id);
        }
      }
    };

    void loadMetadata();
  }, []);

  useEffect(() => {
    if (!selectedFlowId) {
      setFlow(null);
      return;
    }

    const loadFlow = async () => {
      const response = await fetch(`/api/flows/${selectedFlowId}`);
      if (!response.ok) {
        setError("Unable to load decision flow.");
        return;
      }
      const data: FlowResponse = await response.json();
      setFlow(data);
      setAnswers({});
      setResult(null);
      setError(null);
    };

    void loadFlow();
  }, [selectedFlowId]);

  const questions = useMemo(() => {
    return flow?.questions ?? [];
  }, [flow]);

  const updateAnswer = (key: string, value: JsonValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const submitDecision = async () => {
    if (!selectedFlowId || !selectedJurisdictionId) {
      setError("Select a flow and jurisdiction to run the test.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const payload = {
      flowId: selectedFlowId,
      jurisdictionId: selectedJurisdictionId,
      debug: true,
      answers: questions.map((question) => ({
        questionKey: question.key,
        value: answers[question.key] ?? null
      }))
    };

    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        setError("Decision engine failed to respond.");
        return;
      }
      const data: DecisionOutput = await response.json();
      setResult(data);
    } catch (err) {
      setError("Decision engine failed to respond.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (question: FlowQuestion) => {
    const currentValue = answers[question.key];
    switch (question.type) {
      case "select": {
        const options = question.options ?? [];
        return (
          <select
            value={(currentValue ?? "") as string}
            onChange={(event) =>
              updateAnswer(
                question.key,
                event.target.value === "" ? null : event.target.value
              )
            }
          >
            <option value="" disabled>
              Select an option
            </option>
            {options.map((option) => {
              const optionValue =
                typeof option === "string" ? option : option.value;
              const label = typeof option === "string" ? option : option.label;
              return (
                <option key={optionValue} value={optionValue}>
                  {label}
                </option>
              );
            })}
          </select>
        );
      }
      case "number":
        return (
          <input
            type="number"
            value={currentValue as number | string | undefined}
            onChange={(event) =>
              updateAnswer(
                question.key,
                event.target.value === "" ? null : Number(event.target.value)
              )
            }
          />
        );
      case "boolean":
        return (
          <select
            value={
              currentValue === true ? "true" : currentValue === false ? "false" : ""
            }
            onChange={(event) => {
              const value = event.target.value;
              updateAnswer(
                question.key,
                value === ""
                  ? null
                  : value === "true"
                    ? true
                    : false
              );
            }}
          >
            <option value="">Select yes/no</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case "text":
      default:
        return (
          <input
            type="text"
            value={(currentValue ?? "") as string}
            onChange={(event) =>
              updateAnswer(
                question.key,
                event.target.value === "" ? null : event.target.value
              )
            }
          />
        );
    }
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <h1>Rule Tester</h1>
        <p className="muted">
          Validate flow logic and view detailed rule matching diagnostics.
        </p>
      </section>

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          <span className="muted">Flow</span>
          <select
            value={selectedFlowId}
            onChange={(event) => setSelectedFlowId(event.target.value)}
          >
            {flows.map((flowOption) => (
              <option key={flowOption.id} value={flowOption.id}>
                {flowOption.label ?? flowOption.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="muted">Jurisdiction</span>
          <select
            value={selectedJurisdictionId}
            onChange={(event) => setSelectedJurisdictionId(event.target.value)}
          >
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction.id} value={jurisdiction.id}>
                {jurisdiction.name}, {jurisdiction.state}
              </option>
            ))}
          </select>
        </label>
        {flow?.description && <p className="muted">{flow.description}</p>}
      </section>

      <section className="card" style={{ display: "grid", gap: 16 }}>
        <h2>Inputs</h2>
        {questions.length === 0 && (
          <p className="muted">Select a flow to load questions.</p>
        )}
        {questions.map((question) => (
          <label key={question.key} style={{ display: "grid", gap: 6 }}>
            <span>
              {question.prompt}
              {question.required && <span> *</span>}
            </span>
            {question.helpText && (
              <span className="muted">{question.helpText}</span>
            )}
            {renderInput(question)}
          </label>
        ))}
        <button
          className="button"
          type="button"
          onClick={submitDecision}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Evaluating..." : "Run tester"}
        </button>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      </section>

      <section className="card" style={{ display: "grid", gap: 16 }}>
        <h2>Decision Output</h2>
        {!result && <p className="muted">Run the tester to see results.</p>}
        {result && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>Outcome:</strong> {result.outcome}
            </div>
            <div>
              <strong>Reasoning</strong>
              <ul>
                {result.reasoning.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Citations</strong>
              <ul>
                {result.citations.map((citation, index) => (
                  <li key={`${citation.ordinanceCode ?? "citation"}-${index}`}>
                    {citation.ordinanceCode ?? "Citation"}{" "}
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
              <strong>Rules Applied</strong>
              <ul>
                {result.rulesApplied.map((rule) => (
                  <li key={rule.ruleId}>
                    {rule.name} ({rule.outcome})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ display: "grid", gap: 16 }}>
        <h2>Debug Panel</h2>
        {!result?.debug && <p className="muted">No debug data returned.</p>}
        {result?.debug && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>Matched Rule IDs</strong>
              <ul>
                {result.debug.matchedRuleIds.map((ruleId) => (
                  <li key={ruleId}>{ruleId}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Failed Rules</strong>
              <ul>
                {result.debug.failedRules.map((rule) => (
                  <li key={rule.ruleId}>
                    {rule.ruleId} — Failed on{" "}
                    <code>{JSON.stringify(rule.failedCondition)}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
