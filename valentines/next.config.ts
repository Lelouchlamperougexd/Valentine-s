import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/Valentine-s" : "",
  assetPrefix: isProd ? "/Valentine-s/" : "",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/Valentine-s" : "",
  },
};

export default nextConfig;
