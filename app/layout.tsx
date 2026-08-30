import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banners of Caldris — War for the Realm",
  description: "Lead the Royal Lions through twelve medieval campaigns in a tense game of conquest.",
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
