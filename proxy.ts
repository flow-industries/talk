import type { NextFetchEvent, NextRequest } from "next/server";
import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { i18n } from "~/utils/i18n";

const i18nMiddleware = createI18nMiddleware(i18n);

export function proxy(request: NextRequest, event: NextFetchEvent) {
	return i18nMiddleware(request, event);
}

export default proxy;

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
