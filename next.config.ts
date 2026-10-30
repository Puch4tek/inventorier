import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.214', 'dev.zigp.pl'],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  async headers() {
    const sensitiveLinkHeaders = [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return [
      { source: "/reset-password", headers: sensitiveLinkHeaders },
      { source: "/api/auth/verify-email", headers: sensitiveLinkHeaders },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
