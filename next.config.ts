import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled to fix react-dnd/react-chessboard double-mount issues in React 19
  /* config options here */
};

export default nextConfig;
