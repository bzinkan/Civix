import ReportPreview from "../components/ReportPreview";
import Paywall from "../components/Paywall";

export default function HomePage() {
  return (
    <div>
      <section>
        <h1>Civix Compliance Intelligence</h1>
        <p className="muted">
          Get authoritative answers to civic rules and unlock step-by-step
          compliance guidance when you need it.
        </p>
        <div style={{ marginTop: 16 }}>
          <a className="button" href="/pricing">
            View pricing
          </a>
        </div>
      </section>

      <section className="card">
        <h2>Instant answers</h2>
        <p className="muted">
          Ask questions about zoning, animals, or local business rules and get
          clear responses powered by the Civix rules engine.
        </p>
      </section>

      <section>
        <ReportPreview />
      </section>

      <section>
        <Paywall />
      </section>
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          padding: "8px 10px",
          background: "#000",
          color: "#fff",
          borderRadius: 8,
          fontSize: 12,
          zIndex: 9999,
        }}
      >
        DEPLOY MARKER: v1
      </div>
    </div>
  );
}
