import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tsparticles/react", "@tsparticles/engine", "@tsparticles/slim"],

  images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "dummyimage.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "coin-images.coingecko.com",
      pathname: "/**",
    },
  ],
},

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;