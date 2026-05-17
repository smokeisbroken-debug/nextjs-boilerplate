import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$BROKE Life Tracker",
  description: "Track wallet leaks, protect Wallet HP, and turn money leaks into saving goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
