import type { NextConfig } from "next";

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

const config: NextConfig = {
  // link direto bonito: seudominio.com/b/CHAVE → função b-redirect (sem Supabase configurado, fica desligado)
  async rewrites() {
    return base ? [{ source: "/b/:k", destination: `${base}/functions/v1/b-redirect?k=:k` }] : [];
  },
  async headers() {
    return [
      {
        source: "/w.js",
        headers: [
          { key: "cache-control", value: "public, max-age=300, stale-while-revalidate=86400" },
          { key: "access-control-allow-origin", value: "*" },
        ],
      },
      {
        source: "/((?!w\\.js).*)",
        headers: [
          { key: "strict-transport-security", value: "max-age=63072000; includeSubDomains" },
          { key: "x-frame-options", value: "DENY" },
          { key: "x-content-type-options", value: "nosniff" },
          { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default config;
