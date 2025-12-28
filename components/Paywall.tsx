export default function Paywall() {
  return (
    <div className="card">
      <h3>Upgrade for step-by-step guidance</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        Reports include permit steps, required forms, and vetted service
        providers.
      </p>
      <div style={{ marginTop: 16 }}>
        <a className="button" href="/pricing">
          Unlock reports
        </a>
      </div>
    </div>
  );
}
