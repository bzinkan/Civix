export default function PricingPage() {
  return (
    <section>
      <h1>Pricing</h1>
      <p className="muted">
        Start with free compliance answers. Upgrade for detailed reports and
        expert guidance.
      </p>
      <div className="card mt-6">
        <h2>Pro Report</h2>
        <p className="muted">One-time report tailored to your project.</p>
        <p className="price-text mt-3">$79</p>
        <a className="button mt-4" href="/dashboard">
          Get report
        </a>
      </div>
    </section>
  );
}
