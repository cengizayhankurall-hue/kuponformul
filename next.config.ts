import type { NextConfig } from "next";

process.env.AWS_EXECUTION_ENV = "AWS_Lambda_nodejs20.x";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium-min", "@sparticuz/chromium", "puppeteer-core"],
  env: {
    AWS_EXECUTION_ENV: "AWS_Lambda_nodejs20.x",
  },
};

export default nextConfig;

