import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16: proxy runs on Node.js (not Edge) — required for Vercel anonymous/preview deploys.
const handleI18n = createMiddleware(routing);

export default handleI18n;

export const config = {
  matcher: ["/", "/(vi|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
