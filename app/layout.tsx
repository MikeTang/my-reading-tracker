import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelf — My Reading Tracker",
  description: "Log every book you read and build a taste profile over time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-800 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
