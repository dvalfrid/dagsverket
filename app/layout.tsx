import type { ReactNode } from "react";
import "./globals.css";

// The real <html>/<body> live in app/[locale]/layout.tsx so the lang attribute
// can follow the active locale. This root only forwards children.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
