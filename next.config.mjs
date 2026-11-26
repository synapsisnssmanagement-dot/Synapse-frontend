/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // Separate build directory for isolated E2E runs (default unchanged).
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
  },
};

export default nextConfig;
