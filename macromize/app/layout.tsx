import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MacroMize — Find food that fits",
  description: "Find the right meals near you, based on your goals.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
