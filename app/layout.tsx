import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axis — Music discovery",
  description:
    "Discover music by similarity dimension — beat, mood, or lyrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  );
}
