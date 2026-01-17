import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

const locales = [
  { locale: "en", name: "English" },
  { locale: "zh", name: "Chinese" },
  { locale: "jp", name: "Japanese" },
];

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <RootProvider
      i18n={{
        locale: lang,
        locales,
      }}
    >
      {children}
    </RootProvider>
  );
}
