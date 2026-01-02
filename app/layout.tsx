import "./globals.css";
import type { ReactNode } from "react";
import Layout from "../components/Layout";

export const metadata = {
  title: "Civix",
  description: "Your local regulatory assistant for permits, zoning, and compliance."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
