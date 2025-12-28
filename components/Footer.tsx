export default function Footer() {
  return (
    <footer
      style={{
        padding: "28px 20px",
        borderTop: "1px solid #e2e8f0",
        background: "#ffffff"
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12
        }}
      >
        <span className="muted">© {new Date().getFullYear()} Civix</span>
        <span className="muted">Built for civic compliance teams.</span>
      </div>
    </footer>
  );
}
