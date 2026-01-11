import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import "fumadocs-ui/style.css";

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  await params;
  return <RootProvider>{children}</RootProvider>;
}
