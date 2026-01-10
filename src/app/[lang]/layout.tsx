import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "fumadocs-ui/style.css";
import "~/styles/globals.css";
import { quicksand } from "~/styles/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://flow.talk"),
  title: {
    default: "Flow Talk Docs",
    template: "%s | Flow Talk Docs",
  },
  description: "Flow Talk Documentation",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html className={`${quicksand.variable} scroll-smooth font-sans`} lang={lang} suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
