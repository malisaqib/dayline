import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/editions/[id]/pdf": ["./src/server/pdf/fonts/**"],
    "/api/pdf/sample": ["./src/server/pdf/fonts/**"],
  },
};

export default nextConfig;
