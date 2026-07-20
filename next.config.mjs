/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The atlas corpus is static and version-controlled, so the whole app can be
  // pre-rendered. `output: 'export'` is switched on by the Capacitor build so the
  // same codebase ships to the app stores; on Vercel we keep the server runtime
  // available for future authenticated features.
  ...(process.env.ATLAS_TARGET === 'capacitor'
    ? { output: 'export', images: { unoptimized: true } }
    : {}),
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
