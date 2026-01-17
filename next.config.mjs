import { createMDX } from 'fumadocs-mdx/next';

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

const withMDX = createMDX();

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["ethereum-identity-kit", "lucide-react"],
  // External packages for server-side (works with both Turbopack and webpack)
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908#issuecomment-1487801131
  serverExternalPackages: ["lokijs", "encoding"],
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // XMTP WASM support
  experimental: {
    webpackBuildWorker: true,
  },

  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default withMDX(config);
