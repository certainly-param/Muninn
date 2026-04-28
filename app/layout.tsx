import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muninn",
  description: "A memory-backed portfolio assistant.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
