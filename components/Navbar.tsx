export default function Navbar() {
  return (
    <header
      style={{
        padding: "20px",
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff"
      }}
    >
      <nav
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <a href="/" style={{ fontWeight: 700 }}>
          Civix
        </a>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/pricing" className="muted">
            Pricing
          </a>
          <a href="/dashboard" className="muted">
            Dashboard
          </a>
        </div>
      </nav>
    </header>
  );
}
