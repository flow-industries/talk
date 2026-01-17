import type { Metadata } from "next";
import type { ReactNode } from "react";
import "~/styles/globals.css";
import "fumadocs-ui/style.css";
import { quicksand } from "~/styles/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://flow.talk"),
  title: {
    default: "Flow Talk Docs",
    template: "%s | Flow Talk Docs",
  },
  description: "Flow Talk Documentation",
};

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${quicksand.variable} scroll-smooth font-sans`} lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
