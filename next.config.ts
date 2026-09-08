import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["node-ical", "node-cron"],
  experimental: {
    // node-ical pulls in a few CJS deps; keep them server-only.
  },
};

export default withNextIntl(nextConfig);
