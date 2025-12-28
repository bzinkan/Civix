export default function PricingPage() {
  return (
    <section>
      <h1>Pricing</h1>
      <p className="muted">
        Start with free compliance answers. Upgrade for detailed reports and
        expert guidance.
      </p>
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Pro Report</h2>
        <p className="muted">One-time report tailored to your project.</p>
        <p style={{ fontSize: 24, fontWeight: 600, marginTop: 12 }}>$79</p>
        <a className="button" href="/dashboard" style={{ marginTop: 16 }}>
          Get report
        </a>
      </div>
    </section>
  );
}
