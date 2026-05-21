import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image URLs come back as 7-day presigned S3 links. We render them through
  // a plain <img>, not next/image, on purpose: a real customer rarely has the
  // S3 host allow-listed up front, and next/image would force that config.
  // Keeping it dumb here is part of the dogfood — see FINDINGS.md.
  reactStrictMode: true,
};

export default nextConfig;
