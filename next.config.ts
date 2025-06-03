
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // The allowedDevOrigins should match the URL you use to access your app in the browser during development.
  // If your Cloud Workstation URL for the app (port 9003) is, for example:
  // https://9003-firebase-studio-xxxx.cluster-xxxx.cloudworkstations.dev
  // then that's what should be here.
  // The HMR WebSocket error (port 9000) is a separate concern, possibly related to proxying in Cloud Workstations.
  // For now, I'm updating this to a more likely pattern for port 9003, but you may need to adjust it.
  allowedDevOrigins: ["https://9003-firebase-studio-1748845330401.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/s2/favicons/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
