import { createFromSource } from "fumadocs-core/search/server";
import { source } from "~/utils/docs/source";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  // Note: Japanese and Chinese are not supported by Orama, using English as fallback
  localeMap: {
    en: { language: "english" },
    zh: { language: "english" },
    jp: { language: "english" },
  }
});
