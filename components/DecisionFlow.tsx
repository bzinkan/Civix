"use client";

import { useEffect, useMemo, useState } from "react";
import type { JsonValue } from "@/lib/json";
import type {
  DecisionInput,
  DecisionOutput
} from "../lib/rules-engine";

type DecisionFlowProps = {
  flowId: string;
  jurisdictionId: string;
  onDecision: (result: DecisionOutput) => void;
};

type FlowQuestion = {
  id: string;
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

export default function DecisionFlow({
  flowId,
  jurisdictionId,
  onDecision
}: DecisionFlowProps) {
  const [flow, setFlow] = useState<FlowResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, JsonValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flowId) {
      setFlow(null);
      return;
    }

    const loadFlow = async () => {
      setError(null);
      const response = await fetch(`/api/flows/${flowId}`);
      if (!response.ok) {
        setError("Unable to load decision flow.");
        return;
      }
      const data: FlowResponse = await response.json();
      setFlow(data);
      setCurrentIndex(0);
      setAnswers({});
    };

    void loadFlow();
  }, [flowId]);

  const questions = useMemo(() => {
    return flow?.questions ?? [];
  }, [flow]);

  const currentQuestion = questions[currentIndex];

  const currentValue = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const updateAnswer = (value: JsonValue) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = async () => {
    if (!currentQuestion) return;
    if (
      currentQuestion.required &&
      (currentValue === undefined || currentValue === "" || currentValue === null)
    ) {
      setError("Please answer the current question to continue.");
      return;
    }
    setError(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    await submitDecision();
  };

  const submitDecision = async () => {
    setIsSubmitting(true);
    setError(null);
    const payload: DecisionInput = {
      jurisdictionId,
      flowId,
      answers: questions.map((question) => ({
        questionId: question.id,
        value: answers[question.id] ?? null
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
      const result: DecisionOutput = await response.json();
      onDecision(result);
    } catch (err) {
      setError("Decision engine failed to respond.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = () => {
    if (!currentQuestion) return null;
    switch (currentQuestion.type) {
      case "select": {
        const options = currentQuestion.options ?? [];
        return (
          <select
            value={(currentValue ?? "") as string}
            onChange={(event) =>
              updateAnswer(event.target.value === "" ? null : event.target.value)
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
                event.target.value === "" ? null : Number(event.target.value)
              )
            }
          />
        );
      case "boolean":
        return (
          <div style={{ display: "flex", gap: 12 }}>
            <label>
              <input
                type="radio"
                name={currentQuestion.id}
                value="true"
                checked={currentValue === true}
                onChange={() => updateAnswer(true)}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name={currentQuestion.id}
                value="false"
                checked={currentValue === false}
                onChange={() => updateAnswer(false)}
              />
              No
            </label>
          </div>
        );
      case "text":
      default:
        return (
          <input
            type="text"
            value={(currentValue ?? "") as string}
            onChange={(event) =>
              updateAnswer(event.target.value === "" ? null : event.target.value)
            }
          />
        );
    }
  };

  if (!flowId) {
    return <p className="muted">Select a flow to begin.</p>;
  }

  if (!flow) {
    return <p className="muted">Loading decision flow...</p>;
  }

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <div>
        <h3>{flow.label ?? flow.name}</h3>
        {flow.description && <p className="muted">{flow.description}</p>}
      </div>

      {currentQuestion && (
        <div style={{ display: "grid", gap: 12 }}>
          <strong>{currentQuestion.prompt}</strong>
          {currentQuestion.helpText && (
            <span className="muted">{currentQuestion.helpText}</span>
          )}
          {renderInput()}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="muted">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <button
          className="button"
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {currentIndex < questions.length - 1 ? "Next" : "Evaluate"}
        </button>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    </div>
  );
}
